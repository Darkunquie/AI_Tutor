// Rate limiter for API endpoints
//
// Two backends:
//   1. Redis (Upstash) — cluster-safe, shared across PM2 workers.
//      Enabled when REDIS_URL + REDIS_TOKEN env vars are set.
//   2. In-memory Map — fallback for single-process / local dev.
//      NOT effective in PM2 cluster mode (each worker has its own counter).

import { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';

// ── Redis client (lazy-initialised, only if env vars present) ─────────────
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis !== null) { return redis; }
  const url = process.env.REDIS_URL;
  const token = process.env.REDIS_TOKEN;
  if (url && token) {
    redis = new Redis({ url, token });
  }
  return redis;
}

/**
 * Extract client IP from request headers in a spoof-resistant way.
 * Prefers x-real-ip (set by trusted Nginx proxy) over x-forwarded-for.
 */
export function getClientIp(request: NextRequest): string {
  // x-real-ip is set by Nginx with $remote_addr — cannot be spoofed by the client
  const realIp = request.headers.get('x-real-ip');
  if (realIp) { return realIp.trim(); }

  // Fallback: use the LAST entry in x-forwarded-for (added by the trusted proxy)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length > 0) { return parts.at(-1)!; }
  }

  return 'unknown-ip';
}

// ── In-memory fallback ────────────────────────────────────────────────────
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupTimer) { return; }
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetTime) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
  if (cleanupTimer.unref) { cleanupTimer.unref(); }
}

// ── Public interface ──────────────────────────────────────────────────────
export interface RateLimitOptions {
  maxAttempts: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // ms until reset
}

export async function checkRateLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  const client = getRedis();

  // ── Redis path ────────────────────────────────────────────────────────
  if (client) {
    const count = await client.incr(key);
    if (count === 1) {
      await client.pexpire(key, options.windowMs);
    }
    let ttlMs = await client.pttl(key);
    // pttl returns -1 (key has no TTL) or -2 (key missing) in edge cases
    // (e.g. crash between INCR and PEXPIRE). Heal by re-setting the TTL.
    if (ttlMs < 0) {
      await client.pexpire(key, options.windowMs);
      ttlMs = options.windowMs;
    }
    const resetIn = ttlMs;
    if (count > options.maxAttempts) {
      return { allowed: false, remaining: 0, resetIn };
    }
    return { allowed: true, remaining: options.maxAttempts - count, resetIn };
  }

  // ── In-memory path ────────────────────────────────────────────────────
  startCleanup();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetTime) {
    store.set(key, { count: 1, resetTime: now + options.windowMs });
    return { allowed: true, remaining: options.maxAttempts - 1, resetIn: options.windowMs };
  }

  if (entry.count >= options.maxAttempts) {
    return { allowed: false, remaining: 0, resetIn: entry.resetTime - now };
  }

  entry.count++;
  return { allowed: true, remaining: options.maxAttempts - entry.count, resetIn: entry.resetTime - now };
}

// Pre-configured limiters
export const LOGIN_RATE_LIMIT: RateLimitOptions = { maxAttempts: 5, windowMs: 60 * 1000 };
export const SIGNUP_RATE_LIMIT: RateLimitOptions = { maxAttempts: 3, windowMs: 60 * 1000 };
