// Groq API client for Talkivo
// Using Llama 3.3 70B - completely free!

import Groq from 'groq-sdk';
import { getRedis } from '@/server/infra/redis';
import { logger } from '@/server/infra/logger';
import { env } from './env';

const GROQ_MODEL = env.GROQ_MODEL;
const GROQ_TIMEOUT = 30000; // 30 seconds

const groq = new Groq({
  apiKey: env.GROQ_API_KEY,
  timeout: GROQ_TIMEOUT,
});

// ── Configuration ────────────────────────────────────────────────────────────
const MAX_CONCURRENT = Number.parseInt(process.env.GROQ_MAX_CONCURRENT ?? '25', 10);
const RPM_LIMIT = Number.parseInt(process.env.GROQ_RPM_LIMIT ?? '25', 10);
const MAX_PER_USER = Number.parseInt(process.env.GROQ_MAX_PER_USER ?? '3', 10);
const SEM_KEY = 'groq:inflight';
const SEM_TTL = 120; // seconds — heals after worker crash
const RPM_KEY = 'groq:rpm';
const CB_KEY = 'groq:circuit';
const CB_FAILURES_KEY = 'groq:failures';
const CB_THRESHOLD = 5; // failures before opening
const CB_TIMEOUT = 30; // seconds circuit stays open
const WAIT_TIMEOUT = 10_000; // 10 seconds

// Fallback in-memory semaphore (used when Redis unavailable)
let inMemoryActive = 0;

// ── Wait queue ───────────────────────────────────────────────────────────────
// Instead of immediately rejecting when all slots are full, callers wait up to
// WAIT_TIMEOUT ms for a slot to free up.
const waitQueue: Array<{ resolve: () => void; timer: ReturnType<typeof setTimeout> }> = [];

// ── Circuit breaker ──────────────────────────────────────────────────────────
async function checkCircuit(): Promise<void> {
  const redis = getRedis();
  if (!redis) { return; }

  const state = await redis.get<string>(CB_KEY);
  if (state === 'open') {
    throw new Error('CIRCUIT_OPEN');
  }
}

async function recordFailure(): Promise<void> {
  const redis = getRedis();
  if (!redis) { return; }

  const count = await redis.incr(CB_FAILURES_KEY);
  if (count === 1) {
    await redis.expire(CB_FAILURES_KEY, 30);
  }
  if (count >= CB_THRESHOLD) {
    await redis.set(CB_KEY, 'open', { ex: CB_TIMEOUT });
    await redis.del(CB_FAILURES_KEY);
    logger.error(
      `Groq circuit breaker OPEN — ${CB_THRESHOLD} failures in 30s. Blocking for ${CB_TIMEOUT}s`,
    );
  }
}

async function recordSuccess(): Promise<void> {
  const redis = getRedis();
  if (!redis) { return; }
  await redis.del(CB_FAILURES_KEY);
}

// ── RPM limiter (sliding window via sorted set) ──────────────────────────────
async function checkRpmLimit(): Promise<void> {
  const redis = getRedis();
  if (!redis) { return; } // skip if no Redis

  const now = Date.now();
  const windowStart = now - 60_000;

  // Remove old entries + count current window + add new entry atomically
  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(RPM_KEY, 0, windowStart);
  pipeline.zcard(RPM_KEY);
  pipeline.zadd(RPM_KEY, { score: now, member: `${now}:${Math.random().toString(36).slice(2)}` });
  pipeline.expire(RPM_KEY, 70); // slightly longer than window

  const results = await pipeline.exec();
  const currentCount = results[1] as number;

  if (currentCount >= RPM_LIMIT) {
    // Remove the entry we just added
    await redis.zremrangebyscore(RPM_KEY, now, now + 1);
    throw new Error('RPM_LIMIT');
  }
}

// ── Per-user concurrency cap ─────────────────────────────────────────────────
async function checkUserConcurrency(userId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) { return; }

  const key = `groq:user:${userId}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 120);
  }
  if (count > MAX_PER_USER) {
    await redis.decr(key);
    throw new Error('USER_CONCURRENT_LIMIT');
  }
}

async function releaseUserSlot(userId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) { return; }
  try {
    const val = await redis.get<number>(`groq:user:${userId}`);
    if (val && val > 0) {
      await redis.decr(`groq:user:${userId}`);
    }
  } catch {
    // best-effort release
  }
}

// ── Redis-backed concurrency semaphore ───────────────────────────────────────
// Caps simultaneous Groq calls cluster-wide (across all PM2 workers).
// Falls back to in-memory if Redis is unavailable.

async function acquireGroqSlot(): Promise<void> {
  const redis = getRedis();
  if (redis) {
    try {
      const count = await redis.incr(SEM_KEY);

      // Always ensure TTL exists (heals stuck keys from crashed workers)
      const ttl = await redis.ttl(SEM_KEY);
      if (ttl < 0) {
        await redis.expire(SEM_KEY, SEM_TTL);
      }

      if (count > MAX_CONCURRENT) {
        await redis.decr(SEM_KEY);
        // Wait in queue instead of throwing immediately
        await waitForSlot();
        return;
      }
      return;
    } catch (err) {
      if (err instanceof Error && err.message === 'AI_BUSY') { throw err; }
      logger.warn('Redis semaphore fallback to in-memory:', err);
    }
  }
  // Fallback to in-memory
  if (inMemoryActive >= MAX_CONCURRENT) {
    await waitForSlot();
    return;
  }
  inMemoryActive++;
}

async function releaseGroqSlot(): Promise<void> {
  const redis = getRedis();
  if (redis) {
    try {
      // Use Lua script to prevent negative values
      await redis.eval(
        `local val = redis.call('GET', KEYS[1])
         if val and tonumber(val) > 0 then
           return redis.call('DECR', KEYS[1])
         end
         return 0`,
        [SEM_KEY],
        [],
      );
    } catch (err) {
      logger.warn('Redis semaphore release error:', err);
    }
  } else {
    inMemoryActive = Math.max(0, inMemoryActive - 1);
  }

  // Wake the next waiter (if any)
  const next = waitQueue.shift();
  if (next) {
    clearTimeout(next.timer);
    next.resolve();
  }
}

// ── Wait queue ───────────────────────────────────────────────────────────────
async function waitForSlot(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      const idx = waitQueue.findIndex((w) => w.resolve === resolve);
      if (idx !== -1) { waitQueue.splice(idx, 1); }
      reject(new Error('AI_BUSY'));
    }, WAIT_TIMEOUT);
    waitQueue.push({ resolve, timer });
  });
}

/** Current number of in-flight Groq requests (exported for health endpoint). */
export async function getActiveGroqRequests(): Promise<number> {
  const redis = getRedis();
  if (redis) {
    try {
      const count = await redis.get<number>(SEM_KEY);
      return count ?? 0;
    } catch {
      // Fall through to in-memory
    }
  }
  return inMemoryActive;
}

// ── Retry with exponential backoff ───────────────────────────────────────────
// Retries on 429 (rate limit) and 503 (Groq overloaded) up to 3 times.
async function withGroqRetry<T>(fn: () => Promise<T>, attempt = 1): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    if ((status === 429 || status === 503) && attempt <= 3) {
      const delayMs = 500 * 2 ** (attempt - 1); // 500ms, 1000ms, 2000ms
      logger.warn(`Groq ${status} — retrying in ${delayMs}ms (attempt ${attempt}/3)`);
      await new Promise((r) => setTimeout(r, delayMs));
      return withGroqRetry(fn, attempt + 1);
    }
    throw err;
  }
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ── Helper: translate internal error codes to user-friendly messages ─────────
function toUserError(error: unknown): Error {
  if (error instanceof Error) {
    switch (error.message) {
      case 'AI_BUSY':
        return new Error('AI service is busy. Please wait a moment and try again.');
      case 'RPM_LIMIT':
        return new Error('AI service is busy. Please wait a moment and try again.');
      case 'USER_CONCURRENT_LIMIT':
        return new Error('You have too many requests in progress. Please wait for them to finish.');
      case 'CIRCUIT_OPEN':
        return new Error('AI service is temporarily unavailable. Please try again in 30 seconds.');
    }
    if ('status' in error && (error as { status: number }).status === 429) {
      return new Error('AI service is busy. Please wait a moment and try again.');
    }
  }
  return new Error('Failed to get response from AI. Please try again.');
}

export async function chat(
  systemPrompt: string,
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  userId?: string,
): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  // 1. Circuit breaker
  await checkCircuit();
  // 2. RPM limiter
  await checkRpmLimit();
  // 3. Per-user concurrency cap
  if (userId) { await checkUserConcurrency(userId); }
  // 4. Global concurrency slot
  await acquireGroqSlot();

  try {
    const result = await withGroqRetry(async () => {
      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) { throw new Error('Empty response from AI model'); }
      return content;
    });

    // 6. Success
    await recordSuccess();
    return result;
  } catch (error: unknown) {
    // 7. Failure
    await recordFailure();
    logger.error('Groq API error:', error);
    throw toUserError(error);
  } finally {
    if (userId) { await releaseUserSlot(userId); }
    await releaseGroqSlot();
  }
}

// For streaming responses — semaphore applied to the initial connection only.
// Mid-stream errors are not retryable without losing already-sent chunks.
export async function* chatStream(
  systemPrompt: string,
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  userId?: string,
): AsyncGenerator<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  // 1. Circuit breaker
  await checkCircuit();
  // 2. RPM limiter
  await checkRpmLimit();
  // 3. Per-user concurrency cap
  if (userId) { await checkUserConcurrency(userId); }
  // 4. Global concurrency slot
  await acquireGroqSlot();

  try {
    const stream = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }

    // 6. Success — stream completed without error
    await recordSuccess();
  } catch (error) {
    // 7. Failure
    await recordFailure();
    logger.error('Groq API streaming error:', error);
    throw toUserError(error);
  } finally {
    if (userId) { await releaseUserSlot(userId); }
    await releaseGroqSlot();
  }
}
