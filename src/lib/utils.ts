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
 * Lightweight logger safe for both client and server.
 * Server-side: JSON lines for PM2 log aggregators.
 * Client-side: plain text for devtools.
 * For server-only code, prefer @/server/infra/logger (has LOG_LEVEL support).
 */
const isServer = globalThis.window === undefined;

function formatLog(level: string, message: string, meta?: Record<string, unknown>): string {
  return JSON.stringify({ level, message, timestamp: new Date().toISOString(), ...meta });
}

function extractMeta(args: unknown[]): Record<string, unknown> | undefined {
  if (args.length === 0) { return undefined; }
  if (args.length === 1 && args[0] instanceof Error) {
    return { error: args[0].message, stack: args[0].stack };
  }
  return { details: args };
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    if (isServer) {
      console.log(formatLog('info', message, meta));
    } else {
      console.log(`[Talkivo] ${message}`, meta ?? '');
    }
  },
  error: (message: string, ...args: unknown[]) => {
    if (isServer) {
      console.error(formatLog('error', message, extractMeta(args)));
    } else {
      console.error(`[Talkivo] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (isServer) {
      console.warn(formatLog('warn', message, extractMeta(args)));
    } else {
      console.warn(`[Talkivo] ${message}`, ...args);
    }
  },
};
