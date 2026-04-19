# Talkivo Backend — Full Implementation Plan + Security Plan

> Companion to [ARCHITECTURE_ANALYSIS.md](./ARCHITECTURE_ANALYSIS.md) and [BACKEND_REDESIGN.md](./BACKEND_REDESIGN.md)
> Generated: 2026-04-18
> Horizon: 6-8 weeks engineering time, evolutionary rollout

---

## 0. How to Read This Plan

- Each phase ships to production before the next starts.
- Every phase has: **work items → exit criteria → rollback plan**.
- Work items are sized in engineer-days (1 person, focused).
- Tasks marked `[P]` can run in parallel with peers.
- A "phase" is not a sprint; it's a coherent slice that leaves the system in a better state than before.
- If a phase slips, it slips — do **not** cut exit criteria to make a deadline.

---

## Phase 1 — Foundations (5-7 engineer-days)

**Goal.** Kill the double-DB-query auth cascade. Introduce the layer boundaries so every later phase has somewhere to land. Zero behavior change visible to users.

### Work items

| # | Task | Effort | Parallel | Depends on |
|---|---|---|---|---|
| 1.1 | Create `src/server/config/index.ts` — Zod-validated config replacing `src/lib/env.ts`. Include `REDIS_URL`, `REDIS_TOKEN`, `GROQ_MAX_CONCURRENT`, `DB_POOL_MAX`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `TRIAL_DAYS`, `LOG_LEVEL`, `NODE_ENV`. | 0.5 d | — | — |
| 1.2 | Create `src/server/infra/db.ts` — Prisma client singleton + `withTransaction(fn)` helper. Move shutdown logic here. | 0.5 d | [P] | 1.1 |
| 1.3 | Create `src/server/infra/redis.ts` — Upstash client, `get/set/del/incr/expire` + `withLock(key, ttl, fn)`. | 0.5 d | [P] | 1.1 |
| 1.4 | Create `src/server/infra/logger.ts` — Pino with AsyncLocalStorage-based `requestId` + `userId` auto-injection. Remove the prod `warn` silencer. | 0.5 d | [P] | 1.1 |
| 1.5 | Create `src/server/http/middleware/request-id.ts` — ULID per request, pushed into `ctxStore`. | 0.25 d | — | 1.4 |
| 1.6 | Create `src/server/repositories/UserRepository.ts` — methods: `findAuthBundle(id)`, `findByEmail(email)`, `findByPhone(phone)`, `create(data)`, `updateStatus(id, status)`, `updateSubscription(id, status, trialEndsAt)`. No other code calls `db.user` after this. | 1 d | — | 1.2 |
| 1.7 | Create `src/server/repositories/SessionRepository.ts` — methods: `create`, `findForUser(id, userId)`, `listForUser(userId, page, size)`, `updateEnd(id, userId, patch)`, `incrementFiller(id, count)`. | 1 d | [P] | 1.2 |
| 1.8 | Create `src/server/http/auth-context.ts` — `requireAuth / requireActiveSubscription / requireAdmin` returning `AuthContext`. Use Redis 60 s cache on the bundle; DB fallback via `UserRepository.findAuthBundle`. | 1 d | — | 1.3, 1.4, 1.6 |
| 1.9 | Migrate every route under `src/app/api/**/route.ts` from `withAuth/withActiveSubscription/withAdmin` to direct `requireAuth(req)` calls. Delete the old wrappers from `src/lib/error-handler.ts`. | 1 d | — | 1.8 |
| 1.10 | Routes that touch `db.user` or `db.session` directly now go through repos. Routes that touch other models (message, vocabulary, error, stats) stay on direct Prisma — those migrate in their own phases. | 0.5 d | [P] | 1.6, 1.7 |
| 1.11 | Wire OpenTelemetry auto-instrumentation for HTTP + Prisma + Redis. Emit to Grafana Cloud free tier. Confirm trace per request with `requestId` span attribute. | 0.5 d | [P] | 1.4 |
| 1.12 | Add `invalidateAuthCache(userId)` call from every place that mutates User (signup approve/reject, trial grant/extend, role change). | 0.25 d | — | 1.8 |

### Exit criteria

- [ ] Every authenticated endpoint runs **≤ 1 DB query before the handler body** (verify by reading 10 OTel traces).
- [ ] No `as any` in `src/server/**`.
- [ ] No `new NextRequest(...)` construction anywhere.
- [ ] `logger.warn` fires in production (check log aggregator).
- [ ] All existing Vitest tests pass.
- [ ] Smoke test: login → list sessions → get session detail → logout, all with `X-Request-Id` in response headers.

### Rollback

Git revert. Old `withAuth` wrappers live in git; reverting brings them back in 1 commit. No schema changes in this phase = zero DB rollback work.

### Risks

- Redis auth cache can mask a bug where a user's status change doesn't invalidate. Mitigation: 60 s TTL caps blast radius; add a feature flag `AUTH_CACHE_ENABLED` to disable globally in 1 minute.
- AsyncLocalStorage bug could drop `requestId`. Mitigation: log a `requestId: 'missing'` marker in the base logger when context is absent; alert if > 0.1 %.

---

## Phase 2 — Chat Correctness (7-10 engineer-days)

**Goal.** Chat turn becomes a server-owned saga. No more split between `/api/chat` (streams, persists nothing) and `/api/messages` (client saves). Mid-stream crashes recover. Retries are idempotent. Groq concurrency is cluster-safe.

### Work items

| # | Task | Effort | Parallel | Depends on |
|---|---|---|---|---|
| 2.1 | Create `src/server/repositories/MessageRepository.ts` and `ErrorRepository.ts`. Methods: `createUserMessage`, `createStreamingAiMessage`, `completeAiMessage`, `listBySession`. | 0.5 d | — | 1.2 |
| 2.2 | Move `CorrectionParser` to `src/server/domain/CorrectionParser.ts` and add `FillerDetector` next to it. Both pure, input-in / output-out. | 0.5 d | [P] | — |
| 2.3 | Rewrite `src/server/infra/groq.ts` with Redis-backed semaphore (INCR/DECR + 120 s TTL heal). Keep retry on 429/503. Connection-acquire retry only, mid-stream errors propagate. | 1 d | [P] | 1.3 |
| 2.4 | Create `src/server/repositories/IdempotencyRepository.ts` + M1 migration for `IdempotencyKey` table (Redis-first lookup, DB for durability > 1 h retention). Actually — store in Redis only, 24 h TTL. Skip the DB table unless compliance demands it. | 0.5 d | [P] | 1.3 |
| 2.5 | Create `src/server/http/middleware/idempotency.ts`. For any POST with `Idempotency-Key`, compute SHA-256 of body + path + userId, look up cached response; return cached on hit, proceed on miss, persist response on completion. | 1 d | — | 2.4 |
| 2.6 | Create `src/server/services/ChatService.ts` implementing the turn saga: ownership → idem lookup → INSERT user msg → INSERT AI msg (STREAMING) → emit `ready` → Groq stream → accumulate + emit `token` → finalize in tx (UPDATE AI msg, INSERT Error rows, INSERT FillerDetection rows, increment session counters) → cache idem response → emit `TurnCompleted` → emit `done`. | 2.5 d | — | 2.1, 2.2, 2.3, 2.5 |
| 2.7 | Add new endpoint `POST /api/v1/sessions/:id/turns` wired to `ChatService.turn()`. Response is SSE with the envelope protocol (`ready` / `token` / `correction` / `done` / `error`). | 0.5 d | — | 2.6 |
| 2.8 | Keep legacy `POST /api/chat` as a thin adapter that calls the same service — logs a deprecation warning. Old clients keep working. | 0.25 d | [P] | 2.7 |
| 2.9 | Client updates: migrate to `/api/v1/sessions/:id/turns` behind a feature flag. Roll out to 10 % → 50 % → 100 %. | 1 d | — | 2.7 |
| 2.10 | Add `Idempotency-Key` handling to `POST /sessions`, `POST /vocabulary`, `POST /messages` (legacy). | 0.5 d | [P] | 2.5 |
| 2.11 | Write integration tests for: (a) happy-path turn, (b) mid-stream Groq error → AI msg stays STREAMING, (c) idem replay returns same `aiMessageId`, (d) Redis semaphore saturation returns 503 cleanly. | 1 d | [P] | 2.6 |

### Exit criteria

- [ ] Tab-close mid-stream → refresh the session in UI → AI message present (possibly partial, marked as such).
- [ ] Same request with same `Idempotency-Key` returns byte-identical response.
- [ ] `groq:inflight` counter in Redis never exceeds `GROQ_MAX_CONCURRENT` under load test (k6 at 50 concurrent turns).
- [ ] `/api/chat` (legacy) still works — adapter test green.
- [ ] No Prisma call inside any route handler body for chat/message/session/vocabulary POST paths.
- [ ] p95 time-to-first-token ≤ 2 s under 50-concurrent load test.

### Rollback

- Feature flag `CHAT_NEW_ENDPOINT` flips client back to `/api/chat`.
- Redis semaphore → toggle `GROQ_SEMAPHORE_BACKEND=memory` env to fall back to the old per-process semaphore.
- Idempotency middleware disabled by setting `IDEMPOTENCY_ENABLED=false`.

### Risks

- Mid-stream saga is the trickiest part of the entire redesign. Budget extra review time.
- Redis unavailability → idem + semaphore both fail. Build in graceful degrade: idem becomes pass-through (risk: double-write); semaphore falls back to per-process. Alert loudly.

---

## Phase 3 — Scale & Observability (7-10 engineer-days)

**Goal.** Move analytics off the hot path. Make the system debuggable. Prepare the pool for real concurrency.

### Work items

| # | Task | Effort | Parallel | Depends on |
|---|---|---|---|---|
| 3.1 | Create `src/server/events/bus.ts` + `InProcessEventBus` (EventEmitter-based, subscribers run on `setImmediate`). Define `SessionCompleted`, `TurnCompleted`, `VocabularyLearned`, `TrialExpired`. | 0.5 d | — | — |
| 3.2 | Create `src/server/jobs/queue.ts` (BullMQ client), `src/server/jobs/workers/{stats,achievements,streak,cleanup}.worker.ts`. Add a separate PM2 process for workers. | 1.5 d | — | 1.3 |
| 3.3 | Move `SessionService.end()` logic off the hot path. The endpoint writes score + endedAt and emits `SessionCompleted`. Subscribers enqueue BullMQ jobs for stats upsert + achievement check + streak recompute. | 1 d | — | 3.1, 3.2 |
| 3.4 | Move `AchievementChecker` behind `AchievementService` + subscriber on `SessionCompleted`. Delete `POST /api/achievements/check` (leave route returning 200 for backwards compat, deprecated). | 0.5 d | [P] | 3.3 |
| 3.5 | Create `src/server/repositories/DailyStatsRepository.ts` and migrate the stats upsert to live inside the stats worker. | 0.5 d | [P] | 3.3 |
| 3.6 | Wire Prometheus `/metrics` endpoint (prom-client). Export: `http_requests_total`, `http_request_duration_seconds`, `groq_inflight`, `groq_queue_wait_seconds`, `db_pool_in_use`, `idempotency_hits_total`, `auth_cache_hits_total`, `auth_cache_misses_total`, `job_duration_seconds`. | 0.5 d | [P] | 1.11 |
| 3.7 | Add PgBouncer in front of Neon (transaction mode, `?pgbouncer=true` on Prisma URL). Validate prepared-statement-free operation under load. | 0.5 d | [P] | — |
| 3.8 | Raise `DB_POOL_MAX` to 10 per worker now that PgBouncer is a multiplier. | 0.1 d | — | 3.7 |
| 3.9 | Set up alerts in Grafana Cloud per §11.4 of the redesign doc. | 0.5 d | [P] | 3.6 |
| 3.10 | Load test with k6: 100 concurrent users, 5 min; verify p95 under target, job queue drains within 10 s steady-state. | 1 d | — | 3.3, 3.7 |

### Exit criteria

- [ ] p95 `/sessions/:id/end` < 100 ms (measure in prod for 24 h).
- [ ] Grafana dashboard shows per-request spans end-to-end including Groq, DB, and Redis segments.
- [ ] Alerts fire in staging when `groq_inflight` spiked artificially.
- [ ] Achievement unlocks happen within 30 s of session end without any client-initiated poll.
- [ ] BullMQ dead-letter queue is empty after load test.

### Rollback

- `EVENT_BUS_MODE=synchronous` env var — subscribers run inline like before.
- PgBouncer → revert Prisma URL to direct Neon. No DB state to roll back.

### Risks

- Prepared-statement incompatibility with PgBouncer transaction mode. Known Prisma issue. Mitigation: `?pgbouncer=true`, run pre-flight smoke test.
- Workers crashing silently. Mitigation: BullMQ UI (bull-board) + metric `job_failed_total`.

---

## Phase 4 — Data Model Cleanup (5-7 engineer-days + migration windows)

**Goal.** Stop writing stringified JSON where Postgres has native types. Fix the TZ drift on DailyStats. Add the missing indexes. Ship admin audit log.

### Work items

| # | Task | Effort | Parallel | Depends on |
|---|---|---|---|---|
| 4.1 | **M1** migration: add `RefreshToken`, `IdempotencyKey` (if durable), `AuditLog`, enums `AuditAction`, `AchievementType`, `FillerDetection` table. Deploy. | 0.5 d | — | — |
| 4.2 | **M2** migration: `CREATE INDEX CONCURRENTLY` for `User(role,status,createdAt)`, `Session(userId,createdAt desc)`, `Vocabulary(userId,reviewedAt)`, `Vocabulary(userId,mastery)`, `DailyStats(userId,date desc)`. Deploy. | 0.5 d | [P] | 4.1 |
| 4.3 | Create `AuditLogRepository` + hook into `AdminService` for every mutation endpoint. Backfill zero rows (fresh log). Deploy. | 1 d | [P] | 4.1 |
| 4.4 | **M4** migration — `DailyStats.date` TZ fix, expand/contract:<br>(a) add `dateUtc Date @db.Date` column, dual-write<br>(b) backfill: `UPDATE dailystats SET date_utc = date::date AT TIME ZONE 'UTC'`<br>(c) switch reads to `dateUtc`<br>(d) drop `date`, rename `dateUtc` → `date` | 1 d over 3 deploys | — | — |
| 4.5 | **M5** migration — `FillerDetection`:<br>(a) dual-write (keep `fillerDetails` JSON + insert rows)<br>(b) backfill historical rows via a script<br>(c) switch reads to the table<br>(d) drop `fillerDetails` column | 1 d over 3 deploys | [P] | 4.1 |
| 4.6 | **M6** migration — drop `Session.vocabularyJson`: stop writing first (1 deploy), verify no reads in code, drop in next deploy. | 0.25 d | [P] | — |
| 4.7 | **M7** migration — drop `Message.corrections`: stop writing first (reads were already defaulting via `safeJsonParse`), verify Error relation covers all readers, drop column. | 0.5 d | [P] | — |
| 4.8 | Rewrite `Session.score` to `@db.SmallInt`. Safe type-widening-compatible change; deploy in one step. | 0.1 d | [P] | — |
| 4.9 | Swap `Achievement.type String` → `AchievementType` enum; backfill free-form values to canonical enum values with a data migration. | 0.5 d | [P] | 4.1 |
| 4.10 | Regression test: run the full `/stats/progress` for a 90-day window on a seeded DB, compare pre/post-migration output byte-for-byte. | 0.5 d | — | 4.4, 4.5 |

### Exit criteria

- [ ] No `safeJsonParse` calls on session/message fields anywhere in source.
- [ ] `SELECT column_name FROM information_schema.columns WHERE table_name IN ('Session','Message') AND data_type='text'` returns only the fields you actually want as text.
- [ ] Every admin mutation produces an `AuditLog` row. Spot-check 10 recent admin actions.
- [ ] `EXPLAIN` on `/admin/users` query shows index usage, no seq scan.

### Rollback

Each migration is expand/migrate/contract — old code works during the expand window. If a deploy fails, revert code; DB is already in the expanded state and remains backwards-compatible.

### Risks

- `CREATE INDEX CONCURRENTLY` on Neon — supported but slow on large tables. At 4 GB it's fine.
- Enum backfill for `Achievement.type` must cover all existing values. Script must fail loud on unknown values, not silent drop.

---

## Phase 5 — Auth Hardening (3-5 engineer-days)

**Goal.** Short-lived access + refresh with `jti`. Revocation < 5 s. No DB hit on hot auth path. bcrypt rounds 12.

### Work items

| # | Task | Effort | Depends on |
|---|---|---|---|
| 5.1 | `AuthService` issues access (15 min) + refresh (30 d) pair. Refresh JWT carries `jti` referencing `RefreshToken` row. | 0.5 d | 4.1 |
| 5.2 | `POST /api/v1/auth/refresh` — verify refresh JWT, look up row, rotate jti (delete old + insert new), return new pair. | 0.5 d | 5.1 |
| 5.3 | `POST /api/v1/auth/logout` — deletes RefreshToken row by jti. | 0.25 d | 5.1 |
| 5.4 | Client update: intercept 401 on access token → call `/refresh` → retry original request. Store refresh in httpOnly cookie (path=/auth). | 1 d | 5.2 |
| 5.5 | `requireAuth` no longer reads User status/role from DB — reads from JWT payload (signed by server) + Redis cache for subscription. Role-change path invalidates Redis cache + revokes all refresh tokens for the user. | 0.5 d | 5.1 |
| 5.6 | Raise bcrypt rounds to 12 in `hashPassword`. Add a `passwordRehashPending` flag to User. On login, if flag set, rehash with 12 rounds and clear the flag. | 0.5 d | — |
| 5.7 | Add cleanup worker: daily job to delete `RefreshToken` rows past `expiresAt`. | 0.1 d | 3.2 |
| 5.8 | Security test: revoke token → wait 5 s → verify subsequent access with the revoked refresh returns 401. | 0.25 d | 5.3 |

### Exit criteria

- [ ] `/auth/me` endpoint issues **zero** DB queries on a warm cache.
- [ ] Manual logout propagates in ≤ 5 s measured end-to-end.
- [ ] No non-admin user holds a valid access token > 16 min after status flip.
- [ ] All new passwords hashed at 12 rounds; legacy passwords rehashed on next login.

### Rollback

Feature flag `REFRESH_TOKENS_ENABLED=false` — falls back to issuing the old 7/30-day access-only JWT. Clients read a capability flag from `/auth/me` response.

### Risks

- Rotation on refresh is easy to get wrong (race: two tabs refresh simultaneously). Mitigation: short grace window (10 s) where old jti still works before being deleted. Standard pattern.

---

## Phase 6 — Optional, Scale > 10 K Users

**Goal.** Ready for 100 K. Do only when actually needed.

### Work items

| # | Task | Effort |
|---|---|---|
| 6.1 | Split API servers from worker processes. API runs on Fly.io / Render / Cloud Run; workers on a separate app. Shared Redis + Postgres. | 2 d |
| 6.2 | `EventBus` upgrades to Redis Streams implementation. API `XADD`, workers `XREADGROUP` with consumer groups. | 1 d |
| 6.3 | Read replica for Neon for `/stats/progress` and admin read-heavy endpoints. Route via Prisma multi-tenant config. | 1 d |
| 6.4 | Autoscale policy: CPU > 60 % for 5 min → +1 instance, < 30 % for 15 min → −1. | 0.5 d |
| 6.5 | CDN for public assets (already Cloudflare; just verify cache headers). | 0.25 d |

### Exit criteria

- [ ] API tier can be restarted without interrupting any in-flight BullMQ job.
- [ ] p95 latency unchanged when scaling from 2 to 10 API instances.
- [ ] Zero-downtime deploy verified.

---

# Security Plan

Not a phase — a cross-cutting concern. Every phase carries security tasks. This section lists the security posture end-to-end after the redesign.

## 1. Threat Model

| Actor | Capability | Interested in |
|---|---|---|
| Anonymous internet | Any public endpoint | Account takeover, credential stuffing, DoS |
| Authenticated user | Own data + valid access token | Escalation to other users' sessions (IDOR), abuse Groq quota |
| Malicious admin | Admin token | Damage beyond scope, silent data exfil |
| Compromised client device | Stolen tokens from the browser | Session hijack, replay |
| Supply chain | npm packages | Malicious dependency |
| Infrastructure | Neon / Upstash operators | Data at rest in cleartext |

## 2. Authentication

| Control | Detail |
|---|---|
| Password hashing | bcrypt 12 rounds; lazy rehash on login for legacy 10-round accounts. |
| Access token | JWT HS256, 15 min, claims `{sub, role, status, jti}`. No PII beyond email-less claims. |
| Refresh token | JWT HS256, 30 d. `{sub, jti}`. Referenced by `RefreshToken` DB row — row delete = revocation. |
| Rotation | Every `/auth/refresh` rotates `jti`. 10 s grace window for in-flight dual-tab refresh. |
| Storage on client | Refresh: httpOnly, Secure, SameSite=Strict cookie, path=`/api/v1/auth`. Access: memory only (not localStorage). |
| JWT secret rotation | Support two secrets during a 48 h rotation window: verify against both, sign with new. |
| Login rate limit | 5 / 60 s per IP (tightens to 2 / 60 s after 3 failures on same email). |
| Signup rate limit | 3 / 60 s per IP. CAPTCHA gate (Cloudflare Turnstile) after 3 failures. |
| Account lockout | 5 consecutive failed logins → 15-minute lockout per email. |
| Password reset | Server-side single-use token, 30-min TTL, invalidates on use or on password change. Tokens stored in `PasswordResetToken(token, userId, expiresAt, usedAt)`. |

## 3. Authorization

| Control | Detail |
|---|---|
| Role gate | `requireAdmin` for every `/admin/**` route. Enforced once, in the auth-context module, not sprinkled in handlers. |
| Subscription gate | `requireActiveSubscription` for every `/chat/**`, `/sessions/**` write, `/vocabulary/**`. |
| Ownership check | Every session/message/vocabulary read asserts `userId = ctx.userId` at the repository layer, not the handler. Repos never expose a "get by ID" that lacks a user scope. |
| Admin audit | Every admin mutation writes to `AuditLog` inside the same transaction as the mutation. No mutation without a log row. |
| Soft-delete / suspend | User suspend = `status=SUSPENDED` + immediate refresh-token revocation + Redis cache invalidation. |

## 4. Input Validation

| Control | Detail |
|---|---|
| Zod at every boundary | No route body / query reaches a service unless it's a parsed DTO. Manual `validateEmail/Phone/Password` deleted. |
| Max body size | Enforced at Nginx (1 MB for `/chat`, 100 KB for everything else). |
| Max message length | Zod `max(4_000)` on user chat turn; history trimmed server-side to last 20 turns regardless of what client sends. |
| Sanitization of context | User-provided `scenario`, `character`, `topic`, etc. stripped of control characters (`\x00-\x1f\x7f`) and length-capped before going into the Groq system prompt. |
| Integer coercion | All `page`, `pageSize`, `days` fields: `z.coerce.number().int().positive().max(100)`. |
| Enum validation | Mode, level, role, category all enum-gated; no string passthrough. |
| File uploads | Not supported yet — if introduced, must go via pre-signed URL to object storage, scan, then link. |

## 5. Transport & Headers

| Control | Detail |
|---|---|
| HTTPS | Cloudflare terminates TLS; Nginx → app is loopback only (same VM) or mTLS (split deploy). |
| HSTS | `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`. |
| CSP | `default-src 'self'; script-src 'self' 'strict-dynamic' nonce-…; connect-src 'self' api.groq.com …; frame-ancestors 'none';` |
| X-Frame-Options | `DENY`. |
| X-Content-Type-Options | `nosniff`. |
| Referrer-Policy | `strict-origin-when-cross-origin`. |
| Permissions-Policy | Deny camera/microphone by default; opened per-page only where the speech flow needs it. |
| CORS | Explicit allowlist; no `*`; `credentials: true` only for auth endpoints, never for chat SSE. |

## 6. Secrets & Config

| Control | Detail |
|---|---|
| Secret storage | `.env` never committed; secrets in host env injected by PM2 (or platform secret manager in Phase 6). |
| Boot-time validation | `src/server/config/index.ts` parses with Zod; missing/weak secret = process exits. `JWT_SECRET` minimum 32 chars enforced. |
| Rotation runbook | Documented procedure for JWT, Redis token, Groq key, DB URL. |
| Git history scan | Pre-commit hook runs `gitleaks` to prevent accidental commits. One-time sweep on current history. |
| Dependency audit | Weekly CI job: `npm audit --production` + `npm outdated`. Critical CVEs page oncall. |

## 7. Rate Limiting & Abuse

| Surface | Limit |
|---|---|
| Signup | 3 / 60 s / IP |
| Login | 5 / 60 s / IP, plus 5 / 15 min / email |
| Chat turn | 30 / 60 s / user (burst) + 500 / day / user (daily cap) |
| Admin actions | 60 / 60 s / admin |
| Password reset request | 3 / 60 min / email |
| Global per-IP | 1000 / 60 s (Nginx-level, protects the app even when Redis is down) |
| Groq concurrency | Redis semaphore, TTL-healed |
| Circuit breaker | `chat_enabled` feature flag → admin can disable chat in < 10 s during Groq outage |

## 8. Data Protection

| Control | Detail |
|---|---|
| At rest | Neon encrypts at rest; Upstash encrypts at rest. Confirm via provider compliance docs. |
| PII surface | `User.email`, `User.phone`, `User.name`. Full-history message content. No SSN/payment yet. |
| Logs | Pino redact rules: `req.headers.authorization`, `req.headers.cookie`, `*.password`, `*.token`. Review logs quarterly for PII leaks. |
| Log retention | 30 days application logs, 90 days audit logs. |
| Backups | Daily `pg_dump` to Backblaze B2; bucket requires MFA-delete; monthly restore drill. |
| Right-to-delete | `AdminService.deleteUser(userId)` cascades to messages, sessions, vocab, stats, achievements. Audit log is **not** cascade-deleted (compliance). |
| Data export | `GET /api/v1/users/me/export` returns a zip of the user's messages + sessions. Must support if regulation demands. |

## 9. Session Security

| Risk | Mitigation |
|---|---|
| Token theft via XSS | Access token in memory only; refresh in httpOnly cookie. Strict CSP. |
| CSRF on refresh endpoint | SameSite=Strict cookie + `Origin` header check on `/auth/refresh`. |
| Token replay | Refresh jti rotation; 10 s grace; reuse of a rotated token triggers immediate revocation of the whole token family + logout-all-sessions. |
| Concurrent login devices | Optional: cap at N active refresh tokens per user; oldest kicked out. |

## 10. API Security

| Control | Detail |
|---|---|
| Idempotency | All writes accept `Idempotency-Key`. Server rejects mismatched body hash on same key → 409 Conflict. |
| IDOR prevention | Repos require `userId` scope; unit tests include an "access other user's session" negative case per route. |
| Mass assignment | Zod schemas whitelist fields; routes never `...body` into Prisma updates. |
| SQL injection | Prisma parameterizes everything; only `$queryRaw` escape hatch is the health check (`SELECT 1`), no user input. |
| GraphQL / ORM traversal | N/A — no GraphQL; Prisma `select` always explicit. |
| Error leakage | Production error responses contain only `{code, message, requestId}`. No stack traces, no Prisma error codes. Internal code maps `P2002 → CONFLICT` etc. |

## 11. Frontend Security (touchpoints)

Not a backend phase, but the frontend must:
- Never log tokens.
- Never render arbitrary HTML from AI responses — Markdown-only via a safe renderer (e.g. `react-markdown` with sanitize plugin).
- Respect CSP nonces; no inline scripts.
- Clear memory tokens on logout and on `visibilitychange` after 30 min idle.

## 12. Supply Chain

| Control | Detail |
|---|---|
| Lockfile | `package-lock.json` committed; CI fails if missing. |
| Provenance | Use `npm install --ignore-scripts` in CI where safe; audit new deps manually. |
| SBOM | `npm sbom` generated on each release (Phase 4). |
| Pinning | Major versions pinned; patch-level auto-update via Dependabot with required review. |
| Vendored typechecks | `pnpm audit` / `npm audit` in CI; nightly scan via OSV-Scanner. |

## 13. Incident Response

| Step | Who | SLA |
|---|---|---|
| Detection | Grafana alerts / user report | n/a |
| Triage | Oncall reads trace + logs via `requestId` | 15 min |
| Mitigation | Feature flags disabled, traffic drained if needed | 30 min |
| Communication | Status page + in-app banner | 1 h |
| Postmortem | Blameless doc committed to repo under `docs/incidents/` | 5 days |

**Kill switches available:**
- `CHAT_ENABLED=false` → `/chat/*` returns 503.
- `SIGNUP_ENABLED=false` → `/auth/signup` returns 503.
- `MAINTENANCE_MODE=true` → all non-`/health` endpoints return 503 with Retry-After.
- `AUTH_CACHE_ENABLED=false` → bypass Redis, always DB.
- `GROQ_SEMAPHORE_BACKEND=memory` → fallback semaphore.

## 14. Compliance Posture (self-assessed)

- **OWASP Top 10 2021**: A01 (broken access) — mitigated by repo-scoped queries + tests. A02 (crypto) — bcrypt 12, JWT HS256 with strong secret. A03 (injection) — Prisma parameterized. A04 (insecure design) — this doc. A05 (misconfig) — Zod config + CSP/HSTS. A07 (auth failures) — rate limit, lockout, short access tokens. A08 (software integrity) — lockfile, audit. A09 (logging) — Pino + audit log. A10 (SSRF) — no user-controlled URLs.
- **GDPR readiness**: consent at signup (to add), data export endpoint, right-to-delete with cascade, breach-notification runbook.
- **DPDP (India)**: phone + email PII; retention schedule documented; deletion honored.

## 15. Security Milestones by Phase

| Phase | Security deliverable |
|---|---|
| 1 | Pino redact rules; request-id-scoped logs; `src/server/config` validates secret strength |
| 2 | Idempotency middleware; CSP headers wired; SSE error envelope never leaks stack traces |
| 3 | Alerts for `http_5xx_rate`, `groq_inflight`, job failures; circuit-breaker feature flags |
| 4 | AuditLog for every admin mutation; missing indexes; DailyStats TZ fix removes a silent data-integrity bug |
| 5 | Short access + rotating refresh with `jti`; bcrypt 12; revocation ≤ 5 s; password reset table |
| 6 | Multi-region considerations (if applicable); mTLS between API and workers |

---

# Appendix A — Engineering Timeline

| Week | Focus |
|---|---|
| 1 | Phase 1 |
| 2-3 | Phase 2 |
| 4-5 | Phase 3 |
| 5-6 | Phase 4 (overlaps with Phase 3 finalization) |
| 6-7 | Phase 5 |
| ≥ 8 | Phase 6 when justified by load |

Total engineering: **6-8 weeks** for one dedicated engineer, or **3-4 weeks** with two engineers pairing per phase.

# Appendix B — Go / No-Go Gates Between Phases

Before starting phase N+1, phase N must have:

1. All exit-criteria checkboxes ticked.
2. Run in production for at least 72 h with no incidents attributable to the phase's changes.
3. Load-test run comparing pre/post on p50, p95, p99 of the relevant endpoint.
4. Runbook updated with new kill switches / alert playbooks.
5. Short retro: what surprised us, what do we change for next phase.
