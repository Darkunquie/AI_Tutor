# Talkivo Web App — Pre-Production Checklist (Web-Adapted)

> Adapted from TheCodingShef's Android Pre-Production Checklist (https://thecodingshef.in/blog/android-app-pre-production-checklist).
> Android-specific items dropped. Web-applicable items kept and mapped to Talkivo's Next.js + Neon + Redis + Groq stack.
> Status column reflects current Talkivo codebase as of 2026-04-18.
> Generated: 2026-04-18

**Legend:** ✅ done · ⚠️ partial · ❌ not yet

---

## 1. Crash-Free Experience

**Goal:** crash-free users > 99 %.

- [ ] Integrate error tracking (Sentry, Highlight, or BetterStack)
- [ ] Capture server errors with request ID + user ID context
- [ ] Capture client errors (unhandled promise rejections, React error boundaries)
- [ ] Test error paths:
  - cold start (first request after deploy)
  - session resume after tab reload
  - mid-stream Groq failure
- [ ] No crashes on:
  - null API responses
  - malformed JWT
  - Redis / DB transient unavailability

**Current Talkivo status:** ❌ `logger.error` → stdout only. No error aggregation.
**Fix:** Phase 3 work — wire Sentry SDK server + client. Hook into Pino transport.

---

## 2. Performance & Smoothness

**Goal:** p95 non-AI endpoint < 300 ms, time-to-first-token < 2 s for chat.

- [ ] No blocking work on the request handler for hot endpoints
- [ ] Long work runs in BullMQ / background job, not inline
- [ ] DB queries indexed; no N+1
- [ ] Connection pool sized correctly (PgBouncer + Neon)
- [ ] Client-side Web Vitals tracked (LCP, INP, CLS)
- [ ] Lighthouse score > 90 on main pages (run in CI)
- [ ] Images optimized (next/image, WebP/AVIF)
- [ ] Bundle analyzed (`@next/bundle-analyzer`); no > 500 KB chunks on critical path

**Current Talkivo status:** ⚠️ `sessions/:id/end` does 4 reads + tx inline (~500 ms p95). No Web Vitals. No bundle budget.
**Fix:** Phase 3 — move analytics to BullMQ workers; add Grafana RUM or web-vitals → `/metrics`.

---

## 3. State Resilience

**Goal:** no data loss on client crash, refresh, or server restart.

- [ ] In-progress chat turn persisted server-side before streaming (client close ≠ lost message)
- [ ] Session state on server, not client
- [ ] Graceful shutdown drains in-flight requests (SIGTERM handler)
- [ ] Forms don't lose input on validation failure
- [ ] Navigation preserves scroll + state where expected

**Current Talkivo status:** ⚠️ chat does NOT persist mid-stream today. Graceful shutdown in `db.ts` is present.
**Fix:** Phase 2 — ChatService saga owns persistence.

---

## 4. Network Handling

**Goal:** never crash on API failure; show proper state.

- [ ] Timeouts on every outbound call (Groq has 30 s ✅)
- [ ] Retry with exponential backoff on 429 / 503 (Groq retry present ✅)
- [ ] Circuit breaker / feature flag for external vendor outage
- [ ] Client shows loading / success / error states explicitly
- [ ] No bare `fetch()` without `try/catch` on client
- [ ] Offline detection + inline banner

**Current Talkivo status:** ⚠️ server side good. Client error UX not audited.
**Fix:** audit client routes; add `CHAT_ENABLED` feature flag (Phase 3).

---

## 5. Security (Critical)

**Goal:** no secret leakage, no common OWASP vulns.

- [ ] No API keys / secrets in client bundle or source
- [ ] `env.ts` validates all secrets at boot (fail fast)
- [ ] HTTPS enforced (HSTS header)
- [ ] CSP header with nonce + strict-dynamic
- [ ] X-Frame-Options: DENY, nosniff, Referrer-Policy
- [ ] Secure storage — tokens in httpOnly cookie, not localStorage
- [ ] Rate limits on login (5/60s), signup (3/60s), chat (30/60s)
- [ ] bcrypt rounds ≥ 12 (lazy rehash from 10)
- [ ] JWT signed HS256 with 32+ char secret
- [ ] Short access token (15 min) + rotating refresh with `jti`
- [ ] SQL injection impossible (Prisma parameterized — ✅)
- [ ] Idempotency keys on all POSTs
- [ ] Admin audit log on every mutation
- [ ] Dependencies scanned (`npm audit` in CI, Dependabot)
- [ ] `gitleaks` pre-commit hook

**Current Talkivo status:** ⚠️ env.ts ✅, rate limits ✅, bcrypt 10, no HSTS/CSP headers, 7-day access JWT (too long), no idem keys, no audit log, no gitleaks.
**Fix:** Phase 1 — CSP/HSTS headers in `next.config`. Phase 2 — idem keys. Phase 4 — audit log. Phase 5 — JWT hardening + bcrypt 12.

---

## 6. Logging & Analytics

**Goal:** every incident traceable; every product decision data-backed.

- [ ] Structured logs (JSON, Pino)
- [ ] Request ID on every log line (AsyncLocalStorage)
- [ ] User ID on every log line where auth'd
- [ ] PII redacted (password, token, cookie, auth header)
- [ ] Log retention: 30 days app logs, 90 days audit
- [ ] Product analytics (PostHog / Plausible / GA4):
  - signups
  - session starts
  - turns sent
  - mode distribution
  - drop-offs per step
- [ ] No `console.log` in production code (ESLint rule)

**Current Talkivo status:** ⚠️ JSON logs ✅ but no request ID, no redact rules, `logger.warn` silenced in prod. No product analytics.
**Fix:** Phase 1 — Pino + AsyncLocalStorage + redact. Phase 3 — product analytics.

---

## 7. Testing Basics

**Goal:** minimum safety net before scaling.

- [ ] Unit tests for pure domain (`ScoreCalculator`, `StreakCalculator`, `CorrectionParser`)
- [ ] Integration tests hitting real Postgres (Testcontainers) for repositories
- [ ] API route tests: auth gates, Zod error shapes, idempotency replay, 429s
- [ ] E2E happy path (Playwright): signup → admin approve → login → chat → end session → stats
- [ ] E2E critical error path (expired trial, rejected account, Groq 503)
- [ ] Test the **production build**, not just dev:
  ```bash
  next build && next start
  # smoke test against port 3000
  ```
- [ ] CI runs all tests on every PR
- [ ] Coverage ≥ 70 % on `src/server` (meaningful, not vanity)

**Current Talkivo status:** ⚠️ 52 unit tests, no Testcontainers, no E2E, no prod-build smoke test.
**Fix:** Phase 1-3 — introduce Testcontainers alongside repo migration; add Playwright in Phase 3.

---

## 8. Architecture Sanity

**Goal:** maintainable, testable, not a ball of mud.

- [ ] Service ≠ god class (no 1000-line file)
- [ ] Repository abstraction present (no Prisma in routes)
- [ ] No direct DB calls from UI / route handler
- [ ] Thin handlers (≤ 25 lines), fat services
- [ ] Dependency direction strict: route → http → service → repository → infra
- [ ] SOLID applied where it matters (SRP for services, DIP for repositories injected)
- [ ] No circular imports

**Current Talkivo status:** ❌ routes own Prisma directly — **exact Phase 1 blocker**.
**Fix:** Phase 1 — introduce `src/server/{http,services,repositories}/`.

---

## 9. UI State Management

**Goal:** no glitches, no resets, no stale data.

- [ ] Loading states everywhere (skeletons, spinners, pending UI)
- [ ] Empty states (first-time user, no sessions yet)
- [ ] Error states visible and actionable (not just toasts that disappear)
- [ ] Optimistic updates where safe; rollback on failure
- [ ] Stale data refetched on focus / reconnect (SWR / React Query)
- [ ] Proper back-button / navigation behavior

**Current Talkivo status:** unaudited. Sweep needed before launch.

---

## 10. Build & Release

**Goal:** releasable artifact matches what was tested.

- [ ] `next build` passes with 0 errors (✅ current)
- [ ] TypeScript strict, 0 errors (✅ current)
- [ ] ESLint passes (no warnings merged)
- [ ] Production build smoke-tested in CI (not just dev)
- [ ] Source maps uploaded to error tracker but not served publicly
- [ ] Version tagged (git tag + `package.json` version) on each release
- [ ] Release notes auto-generated from PR titles
- [ ] Canary / staged rollout possible (feature flag or % routing)

**Current Talkivo status:** ✅ build green, ✅ TS 0 errors. ❌ no CI smoke test, no release tags, no staged rollout.
**Fix:** Phase 3 — CI step: `next build && next start` + curl `/health/ready`.

---

## 11. Legal / Store Prep (Web equivalent of Play Store)

**Goal:** compliant public launch.

- [ ] Privacy Policy (GDPR/DPDP-compliant)
- [ ] Terms & Conditions
- [ ] Refund Policy (if paid)
- [ ] Cookie consent banner (if EU users)
- [ ] Data export endpoint (`/users/me/export`)
- [ ] Data deletion endpoint (right-to-be-forgotten)
- [ ] Clear consent at signup
- [ ] Contact / support email published
- [ ] Favicon, og:image, Twitter card set on every page
- [ ] robots.txt + sitemap.xml
- [ ] 404 and 500 pages styled

**Current Talkivo status:** unknown — frontend audit needed.

---

## 12. UX Essentials

**Goal:** polish = retention.

- [ ] Loading states on every async boundary
- [ ] Empty states for new users
- [ ] Error states with clear recovery path
- [ ] Back navigation doesn't lose context
- [ ] Forms: inline validation, disabled submit while pending, focus on first error
- [ ] Keyboard navigation works on critical flows
- [ ] Mobile-responsive (test at 375 px width)
- [ ] Accessibility: alt text, semantic HTML, contrast ≥ 4.5:1, tab order, ARIA where needed

---

## 13. Blocking / Hanging Prevention (Server-side "ANR")

**Goal:** no request hangs beyond its budget.

- [ ] Every outbound call has a timeout
- [ ] Long DB queries have a timeout (`statement_timeout`)
- [ ] Chat stream has a server-side deadline (e.g. 60 s hard cap)
- [ ] Workers have per-job timeout + retries with backoff
- [ ] No synchronous heavy loops on the request path
- [ ] Health endpoint returns within 1 s or flags unhealthy

**Current Talkivo status:** ⚠️ Groq SDK has 30 s timeout ✅. No DB statement_timeout. No chat deadline.
**Fix:** set `statement_timeout = '5s'` on Neon role; add 60 s AbortController on chat stream.

---

## 14. Offline / Edge Handling

**Goal:** degrade gracefully; don't crash.

- [ ] Detect offline on client (`navigator.onLine` + heartbeat)
- [ ] Retry UI for failed requests
- [ ] Cache last-known state where safe (SWR stale-while-revalidate)
- [ ] Static pages (pricing, about) served via CDN
- [ ] `/health` returns JSON, always

**Current Talkivo status:** `/health` ✅. No client offline handling.

---

## 15. Post-Launch Readiness

**Goal:** detect, diagnose, fix in minutes not days.

- [ ] Monitors for: 5xx rate, p95 latency, DB pool saturation, Groq queue depth, job failures
- [ ] Alerts routed to oncall (PagerDuty / BetterStack / email)
- [ ] Runbooks for common incidents (Neon down, Groq quota hit, Redis down)
- [ ] Feature flags documented and testable
- [ ] Rollback procedure documented:
  - git revert path
  - DB migration rollback per migration
  - Neon PITR procedure
- [ ] Staged deploy (10 % → 50 % → 100 %)
- [ ] Changelog committed to repo on each release
- [ ] Daily backup verified (monthly restore drill)

**Current Talkivo status:** ⚠️ `/health` exists; no alerts, no runbooks, no rollback doc, no restore drill.
**Fix:** Phase 3 — Grafana alerts + on-call route. Phase 4+ — write runbooks in `docs/incidents/`.

---

## 16. Common Mistakes to Audit Before Launch

- ❌ All logic inside route handler — fix with service/repo layer (Phase 1)
- ❌ No graceful shutdown — (handled in `db.ts` ✅)
- ❌ Blocking calls on hot path — audit every handler for sync I/O
- ❌ Hardcoded strings / configs — enforce via Zod config module
- ❌ No error states in UI — sweep every page
- ❌ No analytics → product decisions made blind
- ❌ Tokens in localStorage — use httpOnly cookie (Phase 5)
- ❌ 500 errors leaking stack traces — error envelope `{code, message, requestId}` only

---

## 17. Launch Gate — "Definition of Done"

Cannot ship to public without:

1. All 🔴 Critical items from [ARCHITECTURE_ANALYSIS.md](ARCHITECTURE_ANALYSIS.md) closed.
2. Phase 1 + Phase 2 + Phase 3 of [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) delivered to production and soaked for 72 h.
3. Error tracking wired + alerts verified firing in staging.
4. Load test at 100 concurrent users passes p95 target.
5. Restore drill done at least once (< 1 h RTO).
6. Privacy policy + terms live on the site.
7. Rollback runbook tested by a non-author.

---

## Mapping Back to Android Source

| Android section | Kept? | Adapted to |
|---|---|---|
| 1. Crash-free (Crashlytics) | ✅ | Sentry / server error tracker |
| 2. Performance | ✅ | p95, Web Vitals, bundle budget |
| 3. Lifecycle safety | ✅ | State resilience (chat saga, graceful shutdown) |
| 4. Network handling | ✅ | Timeouts, retry, circuit breaker, client states |
| 5. Security | ✅ | OWASP web controls |
| 6. Logging & analytics | ✅ | Pino + requestId + product analytics |
| 7. Testing basics | ✅ | Unit + integration (Testcontainers) + E2E (Playwright) |
| 8. Architecture sanity | ✅ | Repo/service layer, direction rules |
| 9. State mgmt (Compose) | ✅ | SWR / React Query + optimistic updates |
| 10. Build & release | ✅ | `next build`, CI smoke, tags, staged rollout |
| 11. Permissions & Play Store | ✅ | Legal pages, consent, data export/delete |
| 12. UX essentials | ✅ | same |
| 13. ANR prevention | ✅ | Request/job timeouts, deadline on stream |
| 14. Offline/edge | ✅ | Client offline detect, CDN static |
| 15. Post-launch | ✅ | Monitors, alerts, runbooks, rollback |
| Common mistakes | ✅ | same conceptual checklist |
| — dropped — Compose remember | ❌ | N/A |
| — dropped — R8/ProGuard | ❌ | N/A |
| — dropped — ViewModel/SavedStateHandle | ❌ | N/A |
| — dropped — Dispatchers.IO/Main | ❌ | N/A |
| — dropped — Play Console ANR | ❌ | N/A |
| — dropped — permissions dialog | ❌ | N/A |
| — dropped — screen rotation | ❌ | N/A |
