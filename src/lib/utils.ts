// Production-safe utilities

/**
 * Safely parse JSON with a fallback value.
 * Prevents crashes from malformed JSON stored in the database.
 */
export function safeJsonParse<T>(
  json: string | null | undefined,
  fallback: T,
  logFailures = false
): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    if (logFailures) {
      console.warn('JSON parse failed:', error);
    }
    return fallback;
  }
}

/**
 * Returns a .catch() handler for fire-and-forget promises.
 * Only logs in development to keep production console clean.
 */
export function logBackgroundError(context: string) {
  return (error: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Background task failed: ${context}]`, error);
    }
  };
}

/**
 * Logger that only outputs in non-production environments.
 */
export const logger = {
  error: (message: string, ...args: unknown[]) => {
    // Always log errors, even in production -- zero visibility is dangerous
    console.error(`[Talkivo] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[Talkivo] ${message}`, ...args);
    }
  },
};
