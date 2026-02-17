// In-memory rate limiter for API endpoints
// Uses a Map with automatic cleanup to prevent memory leaks

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
