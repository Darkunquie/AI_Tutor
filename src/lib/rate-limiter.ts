// In-memory rate limiter for API endpoints
// Uses a Map with automatic cleanup to prevent memory leaks
//
// IMPORTANT: This in-memory rate limiter works correctly for long-running Node.js
// processes (e.g., PM2 fork mode, Docker), but is NOT effective in serverless
// environments (Vercel, AWS Lambda) or PM2 cluster mode where each worker
// gets its own memory space. For those, replace with Redis-backed rate limiting.

import { NextRequest } from 'next/server';

/**
 * Extract client IP from request headers in a spoof-resistant way.
 * Prefers x-real-ip (set by trusted Nginx proxy) over x-forwarded-for.
 */
export function getClientIp(request: NextRequest): string {
  // x-real-ip is set by Nginx with $remote_addr — cannot be spoofed by the client
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  // Fallback: use the LAST entry in x-forwarded-for (added by the trusted proxy)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts.at(-1)!;
  }

  return 'unknown-ip';
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetTime) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
  // Allow Node.js to exit even if timer is active
  if (cleanupTimer.unref) cleanupTimer.unref();
}

interface RateLimitOptions {
  maxAttempts: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // ms until reset
}

export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  startCleanup();

  const now = Date.now();
  const entry = store.get(key);

  // No entry or expired — allow and start fresh window
  if (!entry || now > entry.resetTime) {
    store.set(key, { count: 1, resetTime: now + options.windowMs });
    return { allowed: true, remaining: options.maxAttempts - 1, resetIn: options.windowMs };
  }

  // Within window — check count
  if (entry.count >= options.maxAttempts) {
    return { allowed: false, remaining: 0, resetIn: entry.resetTime - now };
  }

  entry.count++;
  return { allowed: true, remaining: options.maxAttempts - entry.count, resetIn: entry.resetTime - now };
}

// Pre-configured limiters
export const LOGIN_RATE_LIMIT: RateLimitOptions = { maxAttempts: 5, windowMs: 60 * 1000 };
export const SIGNUP_RATE_LIMIT: RateLimitOptions = { maxAttempts: 3, windowMs: 60 * 1000 };
