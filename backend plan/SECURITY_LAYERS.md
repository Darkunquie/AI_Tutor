# Talkivo — Security Layers (Full Stack)

> Companion to [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) §Security Plan and [PROD_CHECKLIST_WEB.md](PROD_CHECKLIST_WEB.md) §5.
> Concrete configs + commands for every layer. Paste-ready.
> Generated: 2026-04-18.

**Thesis.** No single control makes a web app safe. 7 layers + strong authentication. Skipping any layer creates a bypass. Order by effort × risk reduction.

**Status legend:** ✅ done · ⚠️ partial · ❌ not yet wired.

---

## Layer Map

| # | Layer | Current status | Effort to close gap |
|---|---|---|---|
| 1 | Code review (static + AI) | ❌ | 30 min |
| 2 | Secret scanning | ❌ | 20 min |
| 3 | Dependency scanning | ❌ | 30 min |
| 4 | Runtime HTTP controls | ⚠️ | 1 d |
| 5 | Authentication & session | ⚠️ | 3-5 d (Phase 5) |
| 6 | Infra hardening | ⚠️ | 2 h |
| 7 | Monitoring + response | ❌ | 1-2 d (Phase 3) |

---

## Layer 1 — Code Review (Static + AI)

**Goal:** no unsafe code merged to `main`.

### 1a. `claude-code-security-review` GitHub Action

Save as `.github/workflows/security-review.yml`:

```yaml
name: Security Review

permissions:
  pull-requests: write
  contents: read

on:
  pull_request:

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha || github.sha }}
          fetch-depth: 2
      - uses: anthropics/claude-code-security-review@main
        with:
          comment-pr: true
          claude-api-key: ${{ secrets.CLAUDE_API_KEY }}
          exclude-directories: "node_modules,.next,src/generated,scripts"
```

Then: Settings → Secrets → Actions → add `CLAUDE_API_KEY`.
Then: Settings → Actions → Fork PR workflows → enable "Require approval for all external contributors".

### 1b. Branch protection on `main`

Repo → Settings → Branches → add rule:

```
Branch name pattern: main
✓ Require a pull request before merging
  ✓ Require approvals (1+)
  ✓ Dismiss stale approvals on new commits
  ✓ Require review from Code Owners (once CODEOWNERS added)
✓ Require status checks to pass before merging
  ✓ Require branches to be up to date before merging
  Required checks:
    - build       (next build)
    - typecheck   (tsc --noEmit)
    - test        (vitest)
    - lint        (eslint)
    - security-review
✓ Require conversation resolution before merging
✓ Do not allow bypassing the above settings
✗ Allow force pushes — NEVER
✗ Allow deletions — NEVER
```

### 1c. ESLint security plugin

```bash
npm i -D eslint-plugin-security
```

Add to `eslint.config.mjs`:

```js
import security from 'eslint-plugin-security';

export default [
  // ... existing config
  security.configs.recommended,
  {
    rules: {
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'error',
      'security/detect-unsafe-regex': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-non-literal-fs-filename': 'error',
    },
  },
];
```

---

## Layer 2 — Secret Scanning

**Goal:** no API key, password, JWT secret, private key enters git history.

### 2a. GitHub native secret scanning

Settings → Code security and analysis → enable:
- Secret scanning (public repos free; private needs GHAS)
- Push protection
- Dependabot alerts
- Dependabot security updates

### 2b. Pre-commit hook with gitleaks

```bash
# Install gitleaks once
npm i -D lint-staged husky
npx husky init
```

`.husky/pre-commit`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npx gitleaks protect --staged --redact --no-banner
```

`.gitleaks.toml` (project root):
```toml
title = "Talkivo gitleaks config"

[extend]
useDefault = true

[[rules]]
id = "jwt-secret"
description = "JWT signing secret"
regex = '''JWT_SECRET\s*=\s*["']?[A-Za-z0-9+/=_-]{20,}'''

[[rules]]
id = "groq-key"
description = "Groq API key"
regex = '''gsk_[A-Za-z0-9]{32,}'''

[[rules]]
id = "neon-url"
description = "Neon connection string"
regex = '''postgres(ql)?://[^"'\s]+@[a-z0-9.-]+\.neon\.tech[^"'\s]*'''

[allowlist]
paths = [
  '''node_modules/''',
  '''\.next/''',
  '''src/generated/''',
]
```

### 2c. History scan (one-time)

```bash
# Scan entire history for leaked secrets — run once
npx gitleaks detect --source . --log-opts="--all" --report-path=gitleaks-report.json

# If any findings: rotate secrets, use BFG to scrub history, force-push after team coordination
```

### 2d. CI scan on every PR

`.github/workflows/gitleaks.yml`:
```yaml
name: Gitleaks
on: [pull_request]
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Layer 3 — Dependency Scanning

**Goal:** no vulnerable npm package ships to production.

### 3a. Dependabot

`.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
      day: monday
      time: "09:00"
      timezone: Asia/Kolkata
    open-pull-requests-limit: 10
    labels: ["dependencies"]
    groups:
      prod-minor-patch:
        dependency-type: production
        update-types: ["minor", "patch"]
      dev-minor-patch:
        dependency-type: development
        update-types: ["minor", "patch"]

  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
```

### 3b. `npm audit` in CI

`.github/workflows/audit.yml`:
```yaml
name: npm audit
on:
  pull_request:
  schedule:
    - cron: "0 3 * * *"   # nightly
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm audit --audit-level=high --production
```

### 3c. OSV-Scanner (catches advisories npm audit misses)

Add step:
```yaml
      - uses: google/osv-scanner-action@v1
        with:
          scan-args: |-
            --recursive
            --skip-git
            ./
```

### 3d. Install hardening

`package.json`:
```json
{
  "scripts": {
    "postinstall": "echo 'done'",
    "audit:prod": "npm audit --production --audit-level=moderate"
  }
}
```

`.npmrc`:
```
ignore-scripts=true
audit-level=moderate
fund=false
```

Then manually allow scripts for trusted packages:
```bash
npm rebuild --ignore-scripts=false bcrypt pg prisma @prisma/client
```

---

## Layer 4 — Runtime HTTP Controls

**Goal:** browser + server refuse unsafe operations at request time.

### 4a. Security headers via `next.config.ts`

```ts
import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https: blob:;
  font-src 'self' data:;
  connect-src 'self' https://api.groq.com https://*.upstash.io https://*.neon.tech wss://*.neon.tech ${isProd ? '' : 'ws://localhost:* http://localhost:*'};
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  object-src 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim();

const securityHeaders = [
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=(), payment=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
```

Note: `microphone=(self)` kept because Talkivo uses speech features.

### 4b. Rate limiting (already present, confirm thresholds)

```
/auth/login    — 5 / 60 s / IP  (existing ✅)
/auth/signup   — 3 / 60 s / IP  (existing ✅)
/chat/*        — 30 / 60 s / user + 500 / day / user  (existing partial)
/admin/*       — 60 / 60 s / admin (existing ✅)
Global Nginx   — 1000 / 60 s / IP (add)
```

Nginx rate-limit snippet:
```nginx
limit_req_zone $binary_remote_addr zone=talkivo_rps:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=talkivo_burst:10m rate=1000r/m;

server {
    limit_req zone=talkivo_rps burst=20 nodelay;
    limit_req zone=talkivo_burst burst=100 nodelay;
    limit_req_status 429;
}
```

### 4c. Cloudflare WAF (free plan)

Cloudflare dashboard → Security → WAF → enable:
- Managed Rules: Cloudflare OWASP + Cloudflare Managed Ruleset
- Bot Fight Mode: on
- Security Level: Medium
- Browser Integrity Check: on
- Challenge Passage: 30 min
- Rate limiting rule: 50 req / 10 s / IP on `/api/*` → Block 1 h

### 4d. Idempotency keys (Phase 2)

Blocks replay attacks + accidental double-charge. Covered in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) §Phase 2.

### 4e. Body size caps

```nginx
location /api/v1/chat/ {
    client_max_body_size 1M;
}
location /api/ {
    client_max_body_size 100K;
}
```

### 4f. CSRF

App is token-based (Bearer JWT in `Authorization` header) → CSRF not applicable for API routes. BUT once refresh token lives in httpOnly cookie (Phase 5), `/auth/refresh` MUST check:
- `SameSite=Strict` on the cookie
- `Origin` header matches production domain
- `Sec-Fetch-Site: same-origin`

---

## Layer 5 — Authentication & Session (CRITICAL — EXPANDED)

**Goal:** only the right user accesses the right data, and for the right amount of time.

### 5.1 Password storage

**Current:** bcrypt rounds 10.
**Target:** bcrypt rounds 12, lazy rehash on login.

```ts
// src/server/infra/auth/password.ts
import bcrypt from 'bcryptjs';

const ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function needsRehash(hash: string): boolean {
  // bcryptjs stores cost as `$2b$12$...`
  const match = hash.match(/^\$2[abxy]\$(\d{2})\$/);
  if (!match) return true;
  return Number(match[1]) < ROUNDS;
}

// In AuthService.login after verifyPassword returns true:
if (needsRehash(user.passwordHash)) {
  const newHash = await hashPassword(plain);
  await userRepo.updatePassword(user.id, newHash);
}
```

### 5.2 Password policy

Enforce at signup + password-change endpoint:

```ts
import { z } from 'zod';

export const PasswordPolicy = z
  .string()
  .min(12)                                 // was 8 — bump to 12
  .max(128)
  .regex(/[a-z]/, 'needs lowercase')
  .regex(/[A-Z]/, 'needs uppercase')
  .regex(/\d/,    'needs digit')
  .refine(async (p) => !(await isBreached(p)), 'password appears in a breach');

// Have I Been Pwned k-anonymity check
async function isBreached(password: string): Promise<boolean> {
  const sha1 = await sha1Hex(password);
  const prefix = sha1.slice(0, 5).toUpperCase();
  const suffix = sha1.slice(5).toUpperCase();
  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: { 'User-Agent': 'talkivo' },
  });
  const text = await res.text();
  return text.split('\n').some(line => line.startsWith(suffix));
}
```

### 5.3 JWT tokens — current vs target

**Current (issues):**
- 7-day access JWT (too long)
- No `jti` (can't revoke without rotating secret)
- Signed with `HS256` + secret (OK) but secret strength unverified
- No refresh token

**Target:**

| Token | TTL | Claims | Storage |
|---|---|---|---|
| Access | **15 min** | `{sub, role, status, jti, iat, exp}` | Memory only on client |
| Refresh | **30 d** | `{sub, jti, iat, exp}` | `httpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=2592000` cookie |

Secret requirements:
- Length ≥ 32 chars
- Stored in env, validated at boot (`src/server/config`)
- Rotation runbook: support 2 secrets simultaneously for 48 h; sign with new, verify against either

```ts
// src/server/services/AuthService.ts (target shape)
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { config } from '@/server/config';

const ACCESS_TTL  = '15m';
const REFRESH_TTL = '30d';

export async function issueTokenPair(user: User, req: { ip?: string; ua?: string }) {
  const accessJti  = randomUUID();
  const refreshJti = randomUUID();

  const access = jwt.sign(
    { sub: user.id, role: user.role, status: user.status, jti: accessJti },
    config.JWT_SECRET,
    { expiresIn: ACCESS_TTL, algorithm: 'HS256' },
  );

  const refresh = jwt.sign(
    { sub: user.id, jti: refreshJti },
    config.JWT_REFRESH_SECRET,             // separate secret, not the same as access
    { expiresIn: REFRESH_TTL, algorithm: 'HS256' },
  );

  await refreshTokenRepo.create({
    jti: refreshJti,
    userId: user.id,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    ip: req.ip,
    userAgent: req.ua,
  });

  return { access, refresh };
}

export async function verifyAccess(token: string) {
  try {
    return jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] }) as AccessClaims;
  } catch {
    return null;
  }
}

export async function rotateRefresh(oldRefresh: string, req) {
  const claims = jwt.verify(oldRefresh, config.JWT_REFRESH_SECRET, { algorithms: ['HS256'] }) as RefreshClaims;
  const row = await refreshTokenRepo.findByJti(claims.jti);
  if (!row || row.revokedAt) {
    // REUSE DETECTED — the token chain was already rotated; assume theft
    await refreshTokenRepo.revokeAllForUser(claims.sub);
    throw ApiError.unauthorized('Refresh token reuse detected — all sessions revoked');
  }
  const user = await userRepo.findAuthBundle(claims.sub);
  if (!user) throw ApiError.unauthorized('User gone');
  await refreshTokenRepo.revoke(claims.jti);      // invalidate old
  return issueTokenPair(user, req);                // issue new pair
}
```

### 5.4 Refresh token reuse detection

If a refresh token's `jti` is presented **after** it has been revoked → attacker replay. Response: revoke **all** refresh tokens for that user (kicks out attacker and victim; victim logs in again). This is industry-standard.

### 5.5 Session revocation paths

| Event | Action |
|---|---|
| User logs out | `DELETE FROM RefreshToken WHERE jti = ?` + invalidate Redis auth cache |
| User changes password | `DELETE FROM RefreshToken WHERE userId = ?` — logs out every device |
| Admin suspends user | Same as above + set `status = SUSPENDED` + invalidate cache |
| Refresh token reuse detected | Same as password change |
| Admin force-logout | Same as password change |
| Role change (USER ⇄ ADMIN) | Invalidate Redis auth cache; optionally revoke refresh tokens |

### 5.6 Rate limits on auth surfaces

| Endpoint | Limit |
|---|---|
| `POST /auth/login` | 5 / 60 s / IP + 5 / 15 min / email |
| `POST /auth/signup` | 3 / 60 s / IP |
| `POST /auth/refresh` | 20 / 60 s / user |
| `POST /auth/password-reset-request` | 3 / 60 min / email |
| `POST /auth/password-reset-confirm` | 5 / 60 min / token |

After 5 failed logins for the same email → lock that account for 15 min (return generic 401 the entire time — don't disclose).

### 5.7 Account lockout + breach flag

```prisma
model User {
  // ... existing
  failedLoginCount Int       @default(0)
  lockedUntil      DateTime?
  lastLoginAt      DateTime?
  lastLoginIp      String?
  passwordChangedAt DateTime @default(now())
}
```

```ts
// AuthService.login
if (user.lockedUntil && user.lockedUntil > new Date()) {
  throw ApiError.unauthorized('Invalid email or password');  // generic message
}
if (!validPassword) {
  const next = user.failedLoginCount + 1;
  await userRepo.update(user.id, {
    failedLoginCount: next,
    lockedUntil: next >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
  });
  throw ApiError.unauthorized('Invalid email or password');
}
// success
await userRepo.update(user.id, {
  failedLoginCount: 0,
  lockedUntil: null,
  lastLoginAt: new Date(),
  lastLoginIp: req.ip,
});
```

### 5.8 Email verification

Signup → user row with `status = PENDING_EMAIL`, issues single-use token:

```prisma
model EmailVerificationToken {
  token     String   @id
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([expiresAt])
}
```

Token = `randomBytes(32).hex()`. TTL 24 h. Single-use (set `usedAt` on click). Invalidate on password change.

### 5.9 Password reset

Same pattern as email verification — server-side single-use token, not a signed JWT.

```prisma
model PasswordResetToken {
  token     String    @id
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
  ip        String?

  @@index([userId])
  @@index([expiresAt])
}
```

Flow:
1. `POST /auth/password-reset-request { email }` — always returns 200 (no email-enumeration). If user exists, generate token + email link. TTL 30 min.
2. `POST /auth/password-reset-confirm { token, newPassword }` — validate token, update password, mark `usedAt`, revoke all refresh tokens, invalidate Redis cache.

### 5.10 MFA (TOTP) — optional, recommend for admins

```prisma
model User {
  // ...
  totpSecret       String?
  totpBackupCodes  String[]            // hashed
  totpEnabledAt    DateTime?
}
```

Library: `otplib`. QR: `qrcode`. Enforce for all admin accounts post-launch.

### 5.11 OAuth (future)

If adding Google/Apple login later:
- Use `auth.js` or `lucia-auth`, don't hand-roll
- Store provider + provider_id, keep local `password` nullable
- Always verify `email_verified` claim from provider

### 5.12 Token revocation latency

Target: ≤ 5 s end-to-end.
Mechanism: `invalidateAuthCache(userId)` calls `redis.del('auth:' + userId)` → next request reads DB → sees new `status`/`role` → enforces.
Access token TTL (15 min) is the worst-case for role downgrade if cache fails open.

### 5.13 Auth headers checklist

```
✓ Only Bearer <access-jwt> in Authorization
✓ Refresh token in httpOnly Secure SameSite=Strict cookie
✓ No token in localStorage, ever
✓ No token in URL query (breaks referer + history)
✓ CORS: credentials=true ONLY for /auth/refresh and /auth/logout
✓ Origin check on /auth/refresh — must match production origin
✓ Logout clears cookie with Max-Age=0
```

### 5.14 Common auth mistakes to audit out

- ❌ "if user.role == 'admin'" in a route — admin check moves to `requireAdmin` middleware
- ❌ Checking JWT claims for `role` and trusting them after role changes — always look up current via cache
- ❌ Passing email in URL for password reset — use POST body
- ❌ Logging full JWT — Pino redact rules
- ❌ Returning "email not found" vs "wrong password" — always generic
- ❌ Sending JWT in GET request body — not supported
- ❌ 302 redirect after login with access token in URL — never
- ❌ Long-lived access tokens — 15 min max

---

## Layer 6 — Infrastructure Hardening

**Goal:** even if application is perfect, infra misconfig doesn't leak.

### 6a. Neon Postgres

- IP allowlist → allow only app server public IP + your office IP; revoke `0.0.0.0/0`
- Role: app user has `SELECT, INSERT, UPDATE, DELETE` on app schema only, not `DROP`, not `SUPERUSER`
- Separate `admin` role for migrations, different password
- `statement_timeout = '5s'` on app role: `ALTER ROLE talkivo_app SET statement_timeout = '5s';`
- `idle_in_transaction_session_timeout = '10s'`
- Enable Point-In-Time Recovery (Neon Scale plan)
- Rotate password every 90 days

### 6b. Upstash Redis

- Rotate tokens every 90 days
- Use read-only token for readers; write token for writers (Phase 3+ when workers separate)
- Enable TLS-only connections
- Configure eviction policy: `allkeys-lru` with maxmemory set

### 6c. Groq API

- Treat API key as tier-0 secret
- Separate keys for dev vs prod
- Monitor daily spend (Groq dashboard)
- Hard cap: kill-switch env `CHAT_ENABLED=false` flips all `/chat/*` to 503

### 6d. DNS + TLS

- Registrar: enable registry lock + MFA
- DNS: CAA records `issue "letsencrypt.org"` → no other CA can issue
- TLS: A+ on ssllabs.com/ssltest — HSTS preload submitted, TLS 1.2+ only
- Certificate monitor: UptimeRobot / BetterStack alert 14 days before expiry

### 6e. Cloudflare

- Always Use HTTPS: on
- HTTPS Redirect: 301
- Min TLS Version: 1.2
- TLS 1.3: on
- Opportunistic Encryption: on
- Automatic HTTPS Rewrites: on
- HSTS: enabled via header (see Layer 4)

### 6f. Server (VM)

- SSH key-only, password disabled: `PasswordAuthentication no` in `/etc/ssh/sshd_config`
- fail2ban for SSH
- UFW: `22, 80, 443` only
- Auto-security-updates: `unattended-upgrades`
- Non-root user runs PM2
- PM2 log rotation configured
- `/tmp` mounted noexec

### 6g. Backups

- Daily `pg_dump` → Backblaze B2 bucket with MFA-delete + object lock
- Retention: 30 daily + 12 monthly
- Quarterly restore drill (actually boot from backup into a staging DB)
- Encrypted at rest (B2 default)

### 6h. GitHub org

- MFA required for all members (Settings → Organization security)
- SSH commit signing enforced on `main` (optional: GPG)
- CODEOWNERS file for critical paths (`/src/server/` → your handle)
- Protected tags for release tags
- Disable Actions from forks of public repo (or require approval)

### 6i. Cloud provider (if/when added)

- Root account: MFA + no daily use
- IAM roles, not long-lived access keys
- Private subnets for DB; app in private subnet behind LB
- S3 buckets: `BlockPublicAccess` on, versioning + MFA-delete
- Security groups: least privilege

---

## Layer 7 — Monitoring & Incident Response

**Goal:** detect in seconds, diagnose in minutes, fix in hours.

### 7a. Error tracking — Sentry

```bash
npm i @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Configure:
- `sentry.server.config.ts` + `sentry.client.config.ts`
- DSN in env (`SENTRY_DSN`)
- Sample rate: `tracesSampleRate: 0.1` in prod
- `beforeSend` hook to strip PII (email, phone)
- Tie request ID: `Sentry.setTag('requestId', ctx.requestId)` in the Pino transport

### 7b. Structured logs — Pino (Phase 1)

Already specified in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md). Redact rules mandatory:

```ts
pino({
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.token',
      '*.refreshToken',
      '*.jwt',
      'user.phone',
    ],
    remove: true,
  },
});
```

### 7c. Metrics — Prometheus

Phase 3. Expose `/metrics`. Counters on: failed logins, 5xx rate, Groq inflight, auth cache hit/miss, idempotency hits, rate-limit rejects.

### 7d. Grafana alerts

| Alert | Threshold | Route |
|---|---|---|
| 5xx rate > 2 % for 5 min | page | oncall |
| Failed login rate > 100 / min | warn | security |
| New user signup burst > 20 / min | warn | fraud |
| `/auth/refresh` reuse-detected events > 5 / hr | page | security |
| Admin action outside business hours | info | security |
| Cert expiry < 14 d | page | oncall |
| DB pool > 80 % for 1 min | warn | oncall |
| Groq 429 burst | warn | oncall |

### 7e. Audit log dashboard

All admin mutations land in `AuditLog` table (Phase 4). Build an admin-only page listing last 100 entries. Weekly review.

### 7f. Incident response runbook

File: `docs/incidents/RUNBOOK.md`.

Core sections:
1. Kill switches (env flags: `CHAT_ENABLED`, `SIGNUP_ENABLED`, `MAINTENANCE_MODE`)
2. Deploy rollback: `git revert <sha> && <deploy>`
3. Neon PITR restore procedure
4. JWT secret rotation (support old+new for 48 h)
5. Groq key rotation
6. User data breach notification template
7. Oncall rotation + escalation tree

---

## 8. Auth Threat → Control Matrix

| Threat | Control | Layer |
|---|---|---|
| Weak passwords | bcrypt 12 + min length 12 + complexity + HIBP | 5.1-5.2 |
| Credential stuffing | Lockout after 5 fails + CAPTCHA + IP rate limit | 5.6-5.7 |
| Phishing stolen password | MFA (Phase 6) | 5.10 |
| Session hijack (XSS) | httpOnly cookie + CSP | 4a + 5.3 |
| Session hijack (network) | HTTPS + HSTS preload | 4a + 6d |
| Token theft from device | Short 15 min access token | 5.3 |
| Token replay | `jti` rotation + reuse detection | 5.3-5.4 |
| Lost password | Self-service reset with single-use token | 5.9 |
| Compromised dep steals token | Supply-chain scanning + CSP | 3 + 4a |
| Insider/admin abuse | Audit log + 2-person review | 5.5 + 7e |
| Insecure OAuth (future) | Use lucia/auth.js, verify email_verified | 5.11 |
| Privilege escalation | Server-side role check every request | Repo layer |
| Email enumeration | Generic 401 on login + generic 200 on reset | 5.6-5.9 |
| Brute force API key | Never expose; rotate 90 d; separate dev/prod | 6c |
| JWT secret leak | Dual-secret rotation window; scan history | 2c + 6d |

---

## 9. Priority-Ordered Action List (what to do this week)

| # | Action | Layer | Effort | Risk reduction |
|---|---|---|---|---|
| 1 | Turn on branch protection + required checks | 1 | 10 min | 🔴 huge |
| 2 | Enable GitHub Secret Scanning + Push Protection | 2 | 5 min | 🔴 huge |
| 3 | Add Dependabot + weekly `npm audit` CI | 3 | 15 min | 🟠 big |
| 4 | Add claude-code-security-review GH Action | 1 | 15 min | 🟠 big |
| 5 | Add security headers in `next.config.ts` | 4 | 20 min | 🟠 big |
| 6 | Add `statement_timeout` + IP allowlist on Neon | 6 | 15 min | 🟠 big |
| 7 | Enable Cloudflare WAF rules + bot fight | 4 | 10 min | 🟡 medium |
| 8 | Pino redact rules (so logs stop leaking) | 7 | 30 min | 🟠 big |
| 9 | gitleaks pre-commit + CI + history scan | 2 | 30 min | 🟠 big |
| 10 | Wire Sentry for server errors | 7 | 1 h | 🟠 big |

**Total to reach ~70 % safety: ~3-4 hours of work.** Then Phase 5 from [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) takes Talkivo to ~90 %.

---

## 10. Reaching the last 10 %

- Quarterly penetration test (external, once Talkivo has revenue)
- Bug bounty (HackerOne / Intigriti) once the team can triage reports within 48 h
- Security training for everyone who commits
- Threat-model review on every new feature larger than 200 lines
- Annual SOC 2 readiness assessment (if enterprise customers require it)

---

## Cross-References

- [ARCHITECTURE_ANALYSIS.md §2.15](ARCHITECTURE_ANALYSIS.md) — JWT jti + revocation finding
- [BACKEND_REDESIGN.md §7](BACKEND_REDESIGN.md) — Auth context design
- [BACKEND_REDESIGN.md §12](BACKEND_REDESIGN.md) — Security hardening section
- [IMPLEMENTATION_PLAN.md §Phase 5](IMPLEMENTATION_PLAN.md) — Auth hardening tasks
- [IMPLEMENTATION_PLAN.md §Security Plan](IMPLEMENTATION_PLAN.md) — 15-section security baseline
- [PROD_CHECKLIST_WEB.md §5](PROD_CHECKLIST_WEB.md) — Launch security checklist
- [LINKS_REVIEW.md](LINKS_REVIEW.md) — Where claude-code-security-review came from
