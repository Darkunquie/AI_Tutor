// Groq API client for Talkivo
// Using Llama 3.3 70B - completely free!

import Groq from 'groq-sdk';
import { logger } from './utils';
import { env } from './env';

const GROQ_MODEL = env.GROQ_MODEL;
const GROQ_TIMEOUT = 30000; // 30 seconds

const groq = new Groq({
  apiKey: env.GROQ_API_KEY,
  timeout: GROQ_TIMEOUT,
});

// ── Concurrency semaphore ──────────────────────────────────────────────────
// Caps simultaneous Groq calls to avoid pile-ups under load.
// Configurable via GROQ_MAX_CONCURRENT env var (default: 25).
let activeGroqRequests = 0;
const MAX_CONCURRENT = Number.parseInt(process.env.GROQ_MAX_CONCURRENT ?? '25', 10);
const waitQueue: Array<() => void> = [];

async function acquireGroqSlot(): Promise<void> {
  if (activeGroqRequests < MAX_CONCURRENT) {
    activeGroqRequests++;
    return;
  }
  await new Promise<void>(resolve => waitQueue.push(resolve));
  activeGroqRequests++;
}

function releaseGroqSlot(): void {
  activeGroqRequests--;
  const next = waitQueue.shift();
  if (next) { next(); }
}

/** Current number of in-flight Groq requests (exported for health endpoint). */
export function getActiveGroqRequests(): number {
  return activeGroqRequests;
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
    logger.error('Groq API error:', error);
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 429) {
      throw new Error('AI service is busy. Please wait a moment and try again.');
    }
    throw new Error('Failed to get response from AI. Please try again.');
  } finally {
    releaseGroqSlot();
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
    logger.error('Groq API streaming error:', error);
    throw new Error('Failed to get response from AI. Please try again.');
  } finally {
    releaseGroqSlot();
  }
}
