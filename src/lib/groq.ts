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

// ── Redis-backed concurrency semaphore ─────────────────────────────────────
// Caps simultaneous Groq calls cluster-wide (across all PM2 workers).
// Falls back to in-memory if Redis is unavailable.
const MAX_CONCURRENT = Number.parseInt(process.env.GROQ_MAX_CONCURRENT ?? '25', 10);
const SEM_KEY = 'groq:inflight';
const SEM_TTL = 120; // seconds — heals after worker crash

// Fallback in-memory semaphore (used when Redis unavailable)
let inMemoryActive = 0;

async function acquireGroqSlot(): Promise<void> {
  const redis = getRedis();
  if (redis) {
    try {
      const count = await redis.incr(SEM_KEY);
      // Set TTL on first increment (or refresh if it was missing)
      if (count === 1) {
        await redis.expire(SEM_KEY, SEM_TTL);
      }
      if (count > MAX_CONCURRENT) {
        await redis.decr(SEM_KEY);
        throw new Error('AI_BUSY');
      }
      return;
    } catch (err) {
      if (err instanceof Error && err.message === 'AI_BUSY') { throw err; }
      logger.warn('Redis semaphore fallback to in-memory:', err);
    }
  }
  // Fallback to in-memory
  if (inMemoryActive >= MAX_CONCURRENT) { throw new Error('AI_BUSY'); }
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
        []
      );
      return;
    } catch (err) {
      logger.warn('Redis semaphore release error:', err);
    }
  }
  inMemoryActive = Math.max(0, inMemoryActive - 1);
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

// ── Retry with exponential backoff ────────────────────────────────────────
// Retries on 429 (rate limit) and 503 (Groq overloaded) up to 3 times.
async function withGroqRetry<T>(fn: () => Promise<T>, attempt = 1): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    if ((status === 429 || status === 503) && attempt <= 3) {
      const delayMs = 500 * 2 ** (attempt - 1); // 500ms, 1000ms, 2000ms
      logger.warn(`Groq ${status} — retrying in ${delayMs}ms (attempt ${attempt}/3)`);
      await new Promise(r => setTimeout(r, delayMs));
      return withGroqRetry(fn, attempt + 1);
    }
    throw err;
  }
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chat(
  systemPrompt: string,
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  await acquireGroqSlot();
  try {
    return await withGroqRetry(async () => {
      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false,
      });

      const result = completion.choices[0]?.message?.content;
      if (!result) { throw new Error('Empty response from AI model'); }
      return result;
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'AI_BUSY') {
      throw new Error('AI service is busy. Please wait a moment and try again.');
    }
    logger.error('Groq API error:', error);
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 429) {
      throw new Error('AI service is busy. Please wait a moment and try again.');
    }
    throw new Error('Failed to get response from AI. Please try again.');
  } finally {
    await releaseGroqSlot();
  }
}

// For streaming responses — semaphore applied to the initial connection only.
// Mid-stream errors are not retryable without losing already-sent chunks.
export async function* chatStream(
  systemPrompt: string,
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): AsyncGenerator<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

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
  } catch (error) {
    if (error instanceof Error && error.message === 'AI_BUSY') {
      throw new Error('AI service is busy. Please wait a moment and try again.');
    }
    logger.error('Groq API streaming error:', error);
    throw new Error('Failed to get response from AI. Please try again.');
  } finally {
    await releaseGroqSlot();
  }
}
