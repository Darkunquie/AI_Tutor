# Architecture Analysis Report — Talkivo Backend

> Generated: 2026-04-18
> Project: Talkivo AI English Tutor
> Scope: `src/app/api/**`, `src/lib/**`, `prisma/schema.prisma`
> Mode: Full Architecture Audit → feeds into backend redesign

---

## Executive Summary

**Overall health: 5.5 / 10.** The codebase has good bones at the *primitive* level — centralized env, custom `ApiError`, Zod schemas, a real error wrapper, bcrypt, JWT, Redis rate limiter, a transaction for session end, Groq retry/semaphore, structured JSON logs. The *architectural* level is weak: there is no service or repository layer, every route is simultaneously controller + service + repository, validation style is split between two paradigms, the middleware stack duplicates DB reads on every request, the concurrency cap on the external AI vendor is per-process rather than per-cluster, and the data model leans on stringified JSON where relations should be. At ~1 K users these rough edges are visible but survivable. Before 10 K they become structural blockers.

**Critical (🔴): 4.** Must fix before scale.
**Major (🟠): 10.** Fix before the next growth phase.
**Moderate (🟡): 8.**
**Minor (🔵): 4.**

**Top 3 priorities:**

1. Introduce a **repository + service layer**. Routes today embed Prisma calls, business rules, score recalculation, and transaction orchestration. Cannot change ORM, cannot unit-test logic, cannot reuse code across routes. This is the #1 structural blocker for the redesign.
2. **Collapse the middleware cascade into a single auth context.** `withActiveSubscription → withAuth` currently runs **two** `db.user.findUnique` calls per authenticated request (one for status/role, one for subscription). At 1 K concurrent users on a pool of 3 × 2 = 6 connections, this is a self-inflicted queue.
3. **Move the Groq concurrency gate to Redis.** The in-memory semaphore (`activeGroqRequests`) is per PM2 worker. With 2 workers × 25 = 50 real concurrency vs the intended 25, token-quota 429s cascade across workers simultaneously.

---

## 1. Architecture Overview

### Stack

Next.js 15 App Router (Node runtime) • TypeScript 5 • Prisma 7 + Neon serverless adapter (WebSocket) • PostgreSQL (Neon) • Groq SDK (Llama 3.3 70B) • Upstash Redis (rate limiter only) • bcryptjs + jsonwebtoken (JWT, 7/30d) • Zod 4 • PM2 cluster mode • Vitest.

### Current shape (simplified)

```
Request
  └─ Next.js route handler (src/app/api/**/route.ts)
        ├─ withActiveSubscription / withAuth / withAdmin / withErrorHandling   (src/lib/error-handler.ts)
        │       └─ verifyToken, db.user.findUnique, checkAndExpireTrial → header injection → request.clone()
        ├─ validateBody / validateQuery  (Zod, same file)
        ├─ checkRateLimit  (Redis or in-memory)
        ├─ db.<model>...   ← controller calls Prisma directly
        ├─ inline business logic (score recalc, daily stats upsert, vocab clamp)
        ├─ chatStream / chat  → Groq SDK + per-process semaphore + retry
        └─ Response.json / SSE stream
```

**Observation:** there is only one architectural layer. The route file *is* the controller, service, repository, and transaction boundary. `src/lib/services/` holds *pure* helpers (`ScoreCalculator`, `StreakCalculator`, `AchievementChecker`, `CorrectionParser`, `trial.ts`) — none of them own persistence, they are invoked by routes that also do the persistence.

### Request lifecycle (auth'd endpoint, e.g. `POST /api/chat`)

1. `withActiveSubscription` wraps → `withAuth` wraps → `withErrorHandling`.
2. `withErrorHandling` try/catches the whole chain.
3. `withAuth` parses Bearer, `jwt.verify`, then `db.user.findUnique({select: {status, role}})`. **DB round-trip #1.**
4. Builds a new `Headers`, **clones the request**, constructs `new NextRequest(url, {method, headers, body} as any)`. Not a supported public API shape — works today, fragile.
5. `withActiveSubscription` reads headers → if not admin → `db.user.findUnique({select: {subscriptionStatus, trialEndsAt}})`. **DB round-trip #2.**
6. `checkAndExpireTrial` → if expired, conditional `db.user.update`. **Possible round-trip #3.**
7. Route handler enters. Re-reads `x-user-id` from headers, re-checks non-null.
8. Route calls `checkRateLimit` (Redis) — **network round-trip #4** (Upstash HTTP).
9. Route validates body with Zod.
10. For chat: sometimes re-queries session ownership (**round-trip #5**), then `acquireGroqSlot` (in-memory), then streams.

For a message-save request, add a second ownership lookup, the insert, a possible `error.createMany`, and a conditional session update — up to **7 DB round-trips** on the hot path. Connection pool is **3 per worker × 2 workers = 6** (per `src/lib/db.ts:20`).

### Module dependency map (actual imports)

```
route handlers ──▶ error-handler ──▶ auth, db, rate-limiter, trial, utils
                        │                │
                        └──▶ errors/*    └──▶ env
services/*  (pure, DB-less)  ← currently not used as orchestrators
schemas/*   (zod)
prompts/*   (static templates)
```

No circular dependencies — but that's because `services/` has almost no DB work. The moment persistence moves into a service, circularity is a real risk unless you introduce a clear direction (route → service → repository → db).

---

## 2. Findings by Category

### 2.1 Architecture: No service or repository layer — routes own everything

**Severity:** 🔴 Critical
**Files:** `src/app/api/sessions/[id]/route.ts:115-179`, `src/app/api/messages/route.ts:37-80`, `src/app/api/vocabulary/route.ts:43-72`, `src/app/api/chat/route.ts:16-102`, `src/app/api/stats/progress/route.ts:12-192`, every other `route.ts`.

**Symptom.** A session-end PATCH does four reads (`message.count`, `error.groupBy`, `message.findMany`, `session.findFirst`), calls a pure helper, then opens a transaction that updates the session and upserts daily stats with another `error.groupBy` + `dailyStats.findUnique` + `vocabulary.count` inside. All of this sits in the route file. The identical "verify session belongs to user" lookup is copied to `/api/chat`, `/api/messages` (POST + GET), `/api/sessions/[id]`, and likely every other session-scoped route.

**Root cause chain.**
- Why is ownership checking duplicated? → Each route writes its own check.
- Why? → There is no `SessionRepository.findForUser(id, userId)`.
- Why? → Prisma is imported directly, so any route can do any query, and copy/paste is easier than extracting.
- Why? → No architectural boundary was defined between "HTTP concerns" and "data concerns."
- **Root cause:** the app was built as a Next.js route tree, not as a service/application. Prisma leaked through every boundary because there were no boundaries.

**Root cause fix.** Introduce three layers explicitly:

```
src/
  server/
    repositories/
      SessionRepository.ts   ← only file that calls db.session
      MessageRepository.ts
      VocabularyRepository.ts
      UserRepository.ts
      DailyStatsRepository.ts
    services/
      SessionService.ts      ← orchestrates repositories, transactions, ScoreCalculator
      ChatService.ts         ← Groq + message persistence in one saga
      VocabularyService.ts
      TrialService.ts        ← already exists; absorb checkAndExpireTrial
      AchievementService.ts
    http/
      handlers/              ← route.ts files import from here, stay thin
      middleware/
```

Repositories expose *intent* (`findForUser`, `endSession`, `incrementFillerCount`), not Prisma query DSL. Services are framework-agnostic and testable with a mock repository. Route files become ~15 lines: parse → call service → respond.

**Rejected patches.**
- ❌ "Extract a helper `getSessionForUser(id, userId)`" — moves the mess, still leaks Prisma types into the HTTP layer.
- ❌ "Leave it and add more JSDoc" — duplication keeps multiplying as more endpoints land.

---

### 2.2 Architecture / Performance: Middleware cascade duplicates DB queries per request

**Severity:** 🔴 Critical
**Files:** `src/lib/error-handler.ts:188-337`.

**Symptom.** Every request through `withActiveSubscription` hits `db.user.findUnique` **twice** — once in `withAuth` (`select: {status, role}`) and again inside `withActiveSubscription` (`select: {subscriptionStatus, trialEndsAt}`). With `max: 3` connections per worker (`src/lib/db.ts:20`) and 2 workers, the pool is 6. A 1 K-user spike with 2 queries per auth'd request starves the pool before the route itself runs.

**Root cause chain.**
- Why two queries? → `withActiveSubscription` composes `withAuth` but can't pass data forward; it communicates via cloned request headers.
- Why headers? → Next.js App Router doesn't have Express-style `req.user`. The author approximated it with `request.clone()` + `new NextRequest(url, {body} as any)` (`error-handler.ts:226-232`) — which is **not a stable public API shape**.
- Why not pass context directly? → Because middlewares are function-wrappers that hand back a handler, not pass a `ctx` object.
- **Root cause:** the middleware pattern is an Express idiom forced into App Router. The right shape is a single `requireUser()` helper that returns a typed `AuthContext`, called from the handler — not a chain of wrappers each doing a fresh DB lookup.

**Root cause fix.**

```ts
// src/server/http/auth-context.ts
export interface AuthContext {
  userId: string;
  role: 'USER' | 'ADMIN';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  subscription: { status: SubscriptionStatus; trialEndsAt: Date | null };
}

export async function requireAuth(req: NextRequest): Promise<AuthContext> {
  const payload = verifyBearer(req);
  const user = await userRepo.findAuthBundle(payload.userId);   // ONE query, all fields
  if (!user) throw ApiError.unauthorized('User no longer exists');
  if (user.role !== 'ADMIN' && user.status !== 'APPROVED') throw ApiError.forbidden(...);
  return { userId: user.id, role: user.role, status: user.status, subscription: {...} };
}

export async function requireActiveSubscription(req: NextRequest): Promise<AuthContext> {
  const ctx = await requireAuth(req);
  if (ctx.role === 'ADMIN') return ctx;
  const effective = await trialService.checkAndExpire(ctx.userId, ctx.subscription);
  if (effective !== 'TRIAL') throw ApiError.forbidden('Trial expired');
  return ctx;
}
```

Handler does `const ctx = await requireActiveSubscription(req)`. One DB query. No header cloning. No `as any`. Typed end-to-end.

**Layer a short-TTL cache (Redis, 30-60 s) keyed by `userId`** for the auth bundle. Invalidate on role/status/subscription change. Cuts auth DB traffic by ~95 %.

**Rejected patches.**
- ❌ "Select all fields in `withAuth`, skip the second query" — still leaves the middleware-wrapper pattern and `new NextRequest(...as any)`.
- ❌ "Increase Neon connection pool" — delays the problem, doesn't remove the two queries.

---

### 2.3 Security / Architecture: `new NextRequest(url, {body} as any)` in auth wrapper

**Severity:** 🟠 Major
**Files:** `src/lib/error-handler.ts:225-232, 283-290`.

**Symptom.** Wrapper clones the request body stream and re-wraps it in a new `NextRequest` via an unsupported constructor overload, with `as any`. Works today on Next 16.1.6. Guaranteed nothing beyond this version. Also: cloning a `ReadableStream` on every request has non-trivial GC cost on chat POSTs that are megabytes of history.

**Root cause.** Same as 2.2 — trying to propagate `x-user-id` to the handler through HTTP header injection rather than a typed in-process context.

**Root cause fix.** Remove the wrapper entirely. Use `requireAuth(req) → AuthContext` inside the handler (see 2.2). No cloning, no header injection, no `as any`.

---

### 2.4 Validation: Two contradictory validation paradigms

**Severity:** 🟠 Major
**Files:** `src/app/api/auth/login/route.ts:30-67`, `src/app/api/auth/signup/route.ts:32-100`, vs `src/app/api/chat/route.ts:28`, `src/app/api/sessions/route.ts:15`, all Zod-based routes.

**Symptom.** Auth routes use hand-rolled `validateEmail` / `validatePhone` / `validatePassword` returning `{isValid, error?}` and respond `{error: "..."}`. Every other route uses Zod + `validateBody` and responds `{error: {message, code, statusCode, details, timestamp}}`. Clients see two incompatible error shapes and must branch on path.

**Root cause.** No unified DTO contract at the HTTP boundary. The auth routes were written first before the Zod pipeline existed, and never migrated.

**Root cause fix.** Define every boundary with Zod. Drop `validateEmail/validatePhone/validatePassword`. Example:

```ts
// src/server/dto/auth.ts
export const LoginDTO = z.object({
  email: z.string().email().max(254).toLowerCase(),
  password: z.string().min(8).max(128),
  rememberMe: z.boolean().optional().default(false),
});
export const SignupDTO = LoginDTO.extend({
  name: z.string().min(2).max(100).trim(),
  phone: z.string().regex(/^(\+91)?[6-9]\d{9}$/).transform(p => p.replace(/[\s\-\(\)]/g, '')),
});
```

Handler: `const dto = await parseBody(req, LoginDTO)`. One shape, one error response format across the entire API.

**Rejected patches.**
- ❌ "Keep both, just match the response shape" — still have two code paths, inconsistent coercion (login lowercases email; signup lowercases separately; Zod can do it in the schema).

---

### 2.5 Concurrency: Groq semaphore is per PM2 worker, not per cluster

**Severity:** 🔴 Critical
**Files:** `src/lib/groq.ts:19-36`.

**Symptom.** `activeGroqRequests` lives in process memory. With 2 PM2 workers and `GROQ_MAX_CONCURRENT=25`, the cluster can have 50 simultaneous Groq calls. Groq free tier enforces tokens-per-minute, not requests-per-concurrency; when the TPM budget is reached, every in-flight stream hits 429 at once. Retries pile on retries across workers.

**Root cause.** Shared resource governance done in local memory. Same class of bug as an in-memory rate limiter in cluster mode (which the rate limiter explicitly solves via Redis — but the semaphore was not migrated).

**Root cause fix.** Move the semaphore to Redis using a token-bucket or counter with `INCR`/`DECR` and expiry-based release.

```ts
// acquire
const current = await redis.incr('groq:inflight');
if (current > MAX_CONCURRENT) {
  await redis.decr('groq:inflight');
  // backoff + retry acquire, or reject 503
}
// release (always, in finally)
await redis.decr('groq:inflight');
// Heal: set EXPIRE on the key so a crashed worker can't leak slots.
```

Better: move to **BullMQ / pgBoss job queue** for chat requests. Workers consume from queue at controlled concurrency; request handlers enqueue + stream from queue result. Decouples request lifetime from AI vendor lifetime.

**Rejected patches.**
- ❌ "Lower `GROQ_MAX_CONCURRENT` to `25/workers`" — guessing game, doesn't scale when you add workers or change the token tier.

---

### 2.6 Chat: Mid-stream failures return HTTP 200 with an error frame

**Severity:** 🟠 Major
**Files:** `src/app/api/chat/route.ts:68-92`, `src/lib/groq.ts:108-144`.

**Symptom.** If `chatStream` throws after the SSE `Response` headers flushed (which they do — headers are `200 text/event-stream` before the first token arrives), the catch inside `ReadableStream.start` writes `data: {"error":"Stream failed"}` and closes. HTTP status is still 200. Client must parse frames to detect failure.

**Root cause.** SSE has no native error channel; this is expected. But the app compounds it with: (a) a generic `'Stream failed'` message that hides the real status code, (b) no server-side persistence of the partial response, (c) no retry-safe design — client doesn't know whether the AI actually saw the prompt.

**Root cause fix.** Pair SSE with a **message-envelope protocol**: `event: token`, `event: error {code, retryable}`, `event: done {messageId}`. Persist the assistant message server-side as it streams (append to a buffer, flush to DB on `done` or on `error`). Client reconciles by `messageId` — if it receives `error` with `retryable: true`, it retries with the same idempotency key and server replays from the saved partial.

---

### 2.7 Chat: Persistence split across two endpoints — lossy on crash

**Severity:** 🟠 Major
**Files:** `src/app/api/chat/route.ts:65-100` vs `src/app/api/messages/route.ts:46-92`.

**Symptom.** `POST /api/chat` streams AI output but writes **nothing** to the DB. The client is expected to separately `POST /api/messages` for both the user turn and the AI turn. If the browser tab closes mid-stream, or if the `/api/messages` call fails, the AI response is lost and the session's message count drifts. Corrections are generated on the client via `CorrectionParser`, also outside the server's knowledge.

**Root cause.** The chat endpoint was designed as a "dumb pipe" for Groq. Domain state (session, messages, corrections, errors, filler counts) is scattered between server and client, with no transactional boundary. There is no `ChatService.turn(userId, sessionId, input)` that owns the full round-trip.

**Root cause fix.** A single chat turn is one service-layer operation:

```ts
// ChatService.turn(userId, sessionId, {message, context})
//   1. Verify session ownership (repo)
//   2. Persist user message (append-only, idempotency key)
//   3. Call Groq (stream OR non-stream)
//   4. Stream tokens to client while accumulating server-side
//   5. On 'done': persist assistant message + parsed corrections + error rows, in one tx
//   6. Emit events: session.turn.completed (for achievements, streaks)
```

Move correction parsing server-side. Client becomes a dumb display, which also removes prompt-injection-through-client-parsing risk.

---

### 2.8 Data model: Stringified JSON where relations/JSONB should be

**Severity:** 🟠 Major
**Files:** `prisma/schema.prisma:49-50, 61`.

- `Session.vocabularyJson String @default("[]")` — marked legacy in the schema comment, still written to by `/api/sessions/[id]`.
- `Session.fillerDetails String @default("[]")` — array of filler-word detections, unqueryable.
- `Message.corrections String?` — JSON string; a `corrections: true` filter or analytics across corrections is impossible without a full-table scan + parse.

**Symptom.** Cannot index, cannot validate at DB level, cannot aggregate. Every reader needs `safeJsonParse` with a fallback. When the shape evolves, old rows are silently wrong.

**Root cause.** Schema evolution without migrations — "add a field fast" was easier than modeling. SQLite-era carryover (TEXT-for-JSON is idiomatic in SQLite, not in Postgres).

**Root cause fix.**
- `fillerDetails` → use Postgres `Json` type (Prisma `Json` scalar) or split into `FillerWordDetection` table if you ever need to query by word.
- `Message.corrections` → already duplicated into `Error` rows at write time (`messages/route.ts:59-69`). Drop the JSON column entirely; read corrections via the `Error` relation.
- `Session.vocabularyJson` → dead column. The `Vocabulary` table supersedes it. Remove with a migration.

---

### 2.9 Data model: `DailyStats.date` is `DateTime` used as a date

**Severity:** 🟡 Moderate
**Files:** `prisma/schema.prisma:108-124`, `src/app/api/sessions/[id]/route.ts:204-205`.

**Symptom.** Server sets `today.setHours(0,0,0,0)` in whatever the Node process TZ is (PM2 inherits system TZ). Two servers in different zones upserting for the "same" user produce different `date` keys. Unique constraint `@@unique([userId, date])` then lets duplicate-logical-day rows exist.

**Root cause fix.** `date Date @db.Date` + normalize in one place (`toISODate(new Date())` using UTC). All math in UTC. TZ is presentation-layer only.

---

### 2.10 Data model: `Achievement.type` is a free-form `String`

**Severity:** 🟡 Moderate
**Files:** `prisma/schema.prisma:175-183`.

Typo in code → silently creates a new achievement type. No DB-level constraint. Ship an enum or a `CHECK (type IN (...))`.

---

### 2.11 Data model: Missing indexes for hot queries

**Severity:** 🟡 Moderate

- Admin users list filters on `status` + `search` + orders by `createdAt desc` (`src/app/api/admin/users/route.ts:17-48`). No index on `(role, status, createdAt)`. At 10 K users the `ILIKE` on `name`/`email` already scans; compound index + `pg_trgm` index is overdue.
- Vocabulary review endpoint likely queries by `(userId, reviewedAt)` or `(userId, mastery < X)`. Only `(userId)` indexed.
- `DailyStats` has `(userId)` indexed but not `(userId, date desc)` — progress endpoint scans then sorts.

---

### 2.12 Concurrency: No idempotency on writes

**Severity:** 🟠 Major
**Files:** session POST, message POST, vocabulary POST, achievements check.

**Symptom.** Client retries a flaky network on `POST /api/sessions` → two sessions created. `POST /api/messages` retried → duplicate message row, duplicate error rows, filler count incremented twice.

**Root cause.** No idempotency key header (`Idempotency-Key`), no deduplication store.

**Root cause fix.** Accept `Idempotency-Key` header on all POSTs. Store key + response in Redis with short TTL (24 h). On replay: return cached response. Mandatory on chat/message/session endpoints; optional everywhere else.

---

### 2.13 Trial: Per-request DB read and write for expiry

**Severity:** 🟡 Moderate
**Files:** `src/lib/services/trial.ts:8-21`, called from `withActiveSubscription` (`error-handler.ts:325`).

**Symptom.** Every authenticated request compares `trialEndsAt` to `now` and, if expired, issues an `UPDATE`. Two concurrent requests past expiry both issue the same idempotent UPDATE (wasted write). The read itself is avoidable — expiry is a pure function of `trialEndsAt` once you have it in context.

**Root cause fix.** Conditional update only fires when status actually flips:

```ts
// Run once per user per expiry event via a nightly job, or:
const flipped = await db.user.updateMany({
  where: { id: userId, subscriptionStatus: 'TRIAL', trialEndsAt: { lte: new Date() } },
  data:  { subscriptionStatus: 'EXPIRED' },
});
// flipped.count === 1 → just expired; === 0 → nothing to do
```

Even better: put `trialEndsAt` in the JWT (short-lived, 15 min) + refresh token. Middleware computes status locally. DB is only touched when the token refreshes.

---

### 2.14 Observability: No request correlation, no tracing, warns silenced in prod

**Severity:** 🟠 Major
**Files:** `src/lib/utils.ts:54-77`.

- `logger.warn` is a **no-op in production** (`utils.ts:70`). Groq retry warnings (`groq.ts:52`) never reach production logs. You will never see rate-limit pressure building.
- No request ID → can't correlate a failed chat turn across the auth middleware, the semaphore wait, the Groq call, and the DB write.
- No metrics (p50/p95/p99 latency, Groq wait time, pool utilization, Redis hit rate).

**Root cause fix.** Pino (or native async_hooks) for structured logging with `requestId` + `userId` context; OpenTelemetry spans around repository + Groq calls; Prometheus `/metrics` endpoint; drop the `warn`-silencing.

---

### 2.15 Security: JWT has no `jti`, role revocation requires DB on every request

**Severity:** 🟡 Moderate
**Files:** `src/lib/auth.ts:55-62`, `error-handler.ts:204-207`.

**Symptom.** Tokens live 7 or 30 days. To support "admin demoted this user", `withAuth` re-queries the DB for current status/role every request — that's why the middleware costs a query. Without `jti` + a blacklist, you can't selectively revoke a token on password change or compromise; you must wait for expiry or rotate the signing secret (which logs everyone out).

**Root cause fix.** Short-lived access token (15 min) + refresh token (7-30 days) stored server-side with a `jti` that can be revoked. Auth middleware verifies signature only → no DB hit on the hot path. Revocation check moves to refresh endpoint. Cache current-state snapshot in Redis keyed by `userId` with 60 s TTL; invalidate on role/status mutation.

---

### 2.16 Configuration: Partial centralization

**Severity:** 🟡 Moderate
**Files:** `src/lib/env.ts`, `src/lib/groq.ts:20`, `src/lib/rate-limiter.ts:17-19`.

**Symptom.** `env.ts` validates `DATABASE_URL`, `JWT_SECRET`, `GROQ_API_KEY`, `GROQ_MODEL`, `NODE_ENV`. But `GROQ_MAX_CONCURRENT`, `REDIS_URL`, `REDIS_TOKEN`, trial days, rate-limit thresholds are read from `process.env` or hardcoded across files.

**Root cause fix.** One Zod-validated config module. Single source. Fail at boot if anything is wrong.

```ts
export const config = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET:   z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  GROQ_API_KEY: z.string(),
  GROQ_MODEL:   z.string().default('llama-3.3-70b-versatile'),
  GROQ_MAX_CONCURRENT: z.coerce.number().int().positive().default(25),
  GROQ_TIMEOUT_MS:     z.coerce.number().int().positive().default(30_000),
  REDIS_URL:   z.string().url().optional(),
  REDIS_TOKEN: z.string().optional(),
  DB_POOL_MAX: z.coerce.number().int().positive().default(3),
  TRIAL_DAYS:  z.coerce.number().int().positive().default(3),
  NODE_ENV:    z.enum(['development','test','production']).default('development'),
}).parse(process.env);
```

---

### 2.17 Connection pool is undersized for 1 K concurrent users

**Severity:** 🟠 Major
**Files:** `src/lib/db.ts:20`.

3 connections × 2 workers = 6. Even after fixing the double-query middleware (2.2), one session PATCH still holds a connection for ~100-200 ms across 6 queries. At ~40 req/s the pool is the bottleneck, not Groq.

**Root cause fix.** Neon Pro allows higher limits; a PgBouncer in transaction mode in front of Neon gives effectively unlimited handles. Configure pool to match workload: `max = (p99_query_time × peak_rps) / workers + headroom`. Also move read-heavy endpoints (progress, stats, admin lists) behind a read-through cache with 30-60 s TTL; many of these are not real-time.

---

### 2.18 No background job system — hot path does analytics

**Severity:** 🟠 Major

`sessions/[id]` PATCH does: score recalc (4 reads) → transactional session update → daily stats upsert (3 more reads inside transaction). The user-facing "end session" button waits for all of this.

**Root cause fix.** Split into (a) synchronous: write session + score (fast), (b) async job: aggregate daily stats, recompute streak, run achievement checks. BullMQ on Redis or `pgBoss` on Postgres. The API returns 202 with a job id for any stat that's not needed in the immediate response.

---

### 2.19 Achievements unlock is client-polled, not event-driven

**Severity:** 🟡 Moderate
**Files:** `src/app/api/achievements/check/route.ts`.

Client must `POST /api/achievements/check` to discover new unlocks. If it forgets, the user never learns they unlocked something. This is classic **anemic event model** — the side effect should fire from the domain event, not a client poll.

**Root cause fix.** When `SessionService.endSession` finishes, emit `session.completed` on an in-process or Redis-backed event bus. `AchievementService` subscribes and runs unlock logic async. Client subscribes (SSE or WebSocket) or polls a `newlyUnlocked` endpoint that returns queue-drained results.

---

### 2.20 No API versioning

**Severity:** 🔵 Minor

All routes live under `/api/...`. Any breaking change requires coordinated client rollout. Introduce `/api/v1/...` from the start of the redesign; add `/api/v2/...` when you break things.

---

### 2.21 Admin actions are not audited

**Severity:** 🟡 Moderate

`POST /api/admin/users/bulk` and status changes touch other users' accounts with no audit trail. `AdminAuditLog(id, adminId, action, targetUserId, diff, ip, createdAt, @@index([adminId, createdAt]))` is essential once you have multiple admins or compliance surface.

---

### 2.22 bcrypt rounds at 10

**Severity:** 🔵 Minor
**Files:** `src/lib/auth.ts:32`.

2026 guidance is 12+. Under a single modern CPU that's ~300 ms per hash — keeps brute-force expensive without hurting login UX. (Raise carefully; rehash on next successful login.)

---

### 2.23 `validateQuery` collapses repeated parameters

**Severity:** 🔵 Minor
**Files:** `src/lib/error-handler.ts:133-152`.

`searchParams.forEach((v, k) => query[k] = v)` silently keeps only the last value of `?tag=a&tag=b`. Future filters will break subtly. Use `searchParams.getAll`.

---

### 2.24 Tests colocated under `src/app/api/**/__tests__` may be route-scanned

**Severity:** 🔵 Minor

Next.js scans `route.ts` files under `app/`. Verify `next.config` excludes test directories or move tests to `tests/` outside `app/`.

---

## 3. Architecture Recommendations (Target State)

### 3.1 Target folder structure

```
src/
  app/api/**/route.ts        ← THIN: parse, call service, respond (≤ 20 lines)
  server/
    http/
      auth-context.ts        ← requireAuth, requireActiveSubscription, requireAdmin
      responses.ts           ← success, paginated, streamResponse
      dto/                   ← Zod schemas per endpoint
    services/                ← business logic, framework-agnostic, unit-testable
      SessionService.ts
      ChatService.ts
      VocabularyService.ts
      AchievementService.ts
      TrialService.ts
      StatsService.ts
    repositories/            ← sole owner of Prisma queries
      SessionRepository.ts
      MessageRepository.ts
      UserRepository.ts
      VocabularyRepository.ts
      DailyStatsRepository.ts
      AchievementRepository.ts
    domain/                  ← pure domain logic (already here: ScoreCalculator, StreakCalculator)
    infra/
      db.ts                  ← Prisma client + pool
      redis.ts               ← Upstash + cache helpers
      groq.ts                ← client + semaphore (now Redis-backed)
      queue.ts               ← BullMQ/pgBoss
      logger.ts              ← pino with requestId context
      events.ts              ← in-process or Redis-backed domain event bus
    config/
      index.ts               ← Zod-validated env, ONE source
  lib/                       ← client-safe utilities only
  generated/prisma/
```

### 3.2 Patterns to introduce

| Pattern | Where |
|---|---|
| Repository pattern | All DB access behind `server/repositories/*`. Services depend on interfaces. |
| Service layer with DI | Services take repositories in constructor. Tests inject fakes. |
| Typed auth context | `requireAuth(req) → AuthContext`, no header cloning. |
| Idempotency keys | All non-GET endpoints accept `Idempotency-Key`. Cache in Redis. |
| Domain events | `session.ended`, `vocabulary.learned`, `user.subscribed` on an event bus. |
| Background jobs | BullMQ queue for stats aggregation, achievement checks, email. |
| Token-bucket rate limits | Redis-based, per-user AND per-IP, with jitter. |
| Short-lived access + refresh JWT | 15 min access, 30 day refresh with `jti`. |
| Cache-aside on auth bundle | Redis 60 s TTL, invalidate on user mutation. |
| OpenTelemetry + Pino | RequestId-scoped logs, spans around repos + Groq. |
| Zod at boundaries only | Trust types after parse. |
| Streaming envelope protocol | `event: token` / `event: error` / `event: done` with `messageId`. |

### 3.3 Migration strategy (incremental, not rewrite)

**Phase 1 — Foundations (1 week).** No behavior change. Introduce repository + service scaffolding; move DB access for ONE domain (Session) behind `SessionRepository`; collapse middleware into `requireAuth`. Unblocks everything else.

**Phase 2 — Chat correctness (1-2 weeks).** `ChatService.turn()` owns full round-trip. Correction parsing moves server-side. Message persistence is server-owned. Idempotency keys on chat/message/session POSTs.

**Phase 3 — Scale & observability (1-2 weeks).** Redis semaphore for Groq. Auth-bundle cache. Pino + OpenTelemetry. BullMQ queue. Move daily stats + achievements to async.

**Phase 4 — Data model cleanup (1 week + migration).** Drop `vocabularyJson`. Convert `fillerDetails` and `Message.corrections` to proper types. Add missing indexes. `DailyStats.date` → `@db.Date`.

**Phase 5 — Auth hardening (3-5 days).** Short access + refresh tokens with `jti`. Revocation list. bcrypt rounds 12. Admin audit log.

Every phase ships incrementally behind feature flags or route-level swaps — no rewrite-from-scratch.

---

## 4. Fix Priority Roadmap

| Priority | Issue | Effort | Impact | Depends on |
|---|---|---|---|---|
| P0 | 2.1 Repository + service layer (Session first) | 3-5 d | Unblocks 2.2, 2.6, 2.7, 2.18, 2.19 | — |
| P0 | 2.2 Collapse middleware, single auth query | 1-2 d | -50% DB traffic per request | Can run parallel to P0.1 |
| P0 | 2.5 Redis-backed Groq semaphore | 0.5 d | Fixes vendor 429 cascades | Redis already present |
| P0 | 2.7 ChatService owns persistence | 2-3 d | No more lost AI responses | 2.1 |
| P1 | 2.4 Unified Zod validation | 0.5 d | One error shape | — |
| P1 | 2.12 Idempotency keys | 1 d | Retry-safe writes | Redis |
| P1 | 2.14 Request ID + Pino + metrics | 1-2 d | Debuggable prod | — |
| P1 | 2.18 Background job queue | 2-3 d | Faster end-session p95 | 2.1 |
| P1 | 2.3 Remove `NextRequest(... as any)` | 0.5 d | Upgrade safety | 2.2 |
| P1 | 2.17 Pool + PgBouncer sizing | 0.5 d + infra | Scale headroom | — |
| P2 | 2.8 Drop stringified JSON columns | 1 d + migration | Queryable data | — |
| P2 | 2.15 Access + refresh JWT w/ jti | 2 d | Revocation + less DB | Redis |
| P2 | 2.16 Full Zod config | 0.5 d | Fail-fast boot | — |
| P2 | 2.19 Event-driven achievements | 1 d | UX parity | 2.18 |
| P3 | 2.9 DailyStats date-type | 0.5 d + migration | TZ correctness | — |
| P3 | 2.10 Achievement type enum | 0.5 d | Data integrity | — |
| P3 | 2.11 Missing indexes | 0.5 d | Query latency | — |
| P3 | 2.21 Admin audit log | 1 d | Compliance | — |
| P4 | 2.6 Streaming envelope protocol | 1-2 d | Better UX on errors | 2.7 |
| P4 | 2.20 API versioning | 0.25 d | Future-proofing | Do now |
| P4 | 2.22 bcrypt 12 | 0.25 d | Security hygiene | — |
| P4 | 2.23 `getAll` in validateQuery | 0.1 d | Correctness | — |
| P4 | 2.24 Test location | 0.25 d | Build cleanliness | — |

Rough total: **2-4 engineer-weeks** of focused work for P0 + P1. Phases can overlap.

---

## 5. Positive Findings

Not everything needs fixing. Things this codebase does well:

- **Centralized env validation** (`src/lib/env.ts`) — fails fast on missing vars. Many projects don't have this.
- **`ApiError` class + `withErrorHandling`** — the bones of a real error strategy are present. Prisma error codes map to HTTP cleanly.
- **Zod schemas** for most non-auth routes are well-structured.
- **Transaction boundary** in session-end PATCH correctly wraps the score write + daily stats write. The author understood when a transaction matters.
- **Session ownership checks** are present everywhere that matters — no IDOR vulnerabilities on the routes reviewed.
- **Groq retry with exponential backoff** on 429/503 — correct classification of retryable statuses.
- **Redis-backed rate limiter** with x-real-ip preference — the spoofing note in comments shows real thought about the trust model.
- **TTL heal** on the rate limiter (`rate-limiter.ts:92-95`) after the recent lockout fix — good incident-driven hardening.
- **Graceful shutdown** in `db.ts` — correctly inline to avoid circular imports with a dedicated shutdown module (and the comment explains why).
- **`vocabulary` upsert uses a pre-read + clamp** to avoid racing past mastery 100 — the author already thought about concurrency here.
- **JSON-line structured logs on server** — ready for aggregation once something is pointed at stdout.
- **`@@unique([userId, word])`, `@@unique([userId, date])`, `@@unique([userId, type])`** — good integrity constraints at the DB level where they're used.
- **Cascade deletes** on user-owned entities (`onDelete: Cascade`) — correct for this domain.
- **Pure domain services** (`ScoreCalculator`, `StreakCalculator`) already exist and are testable. They are the seed of the service layer — the redesign extends this pattern rather than introducing it.

The redesign is **evolutionary**, not a rewrite.
