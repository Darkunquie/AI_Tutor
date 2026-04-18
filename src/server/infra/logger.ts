// Structured JSON logger with level filtering
//
// Outputs JSON lines on the server for easy parsing by log aggregators (PM2, etc.).
// Will be replaced with Pino in Phase 3 for requestId correlation and child loggers.
//
// IMPORTANT: warn is NOT silenced in production (fixes bug from src/lib/utils.ts logger).

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type LogLevel = keyof typeof LOG_LEVELS;

function getLevel(): LogLevel {
  // Read from env directly to avoid circular deps with config module
  const level = process.env.LOG_LEVEL || 'info';
  if (level in LOG_LEVELS) {
    return level as LogLevel;
  }
  return 'info';
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[getLevel()];
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (shouldLog('debug')) {
      console.debug(JSON.stringify({
        level: 'debug',
        timestamp: new Date().toISOString(),
        message: args,
      }));
    }
  },

  info: (...args: unknown[]) => {
    if (shouldLog('info')) {
      console.info(JSON.stringify({
        level: 'info',
        timestamp: new Date().toISOString(),
        message: args,
      }));
    }
  },

  warn: (...args: unknown[]) => {
    if (shouldLog('warn')) {
      console.warn(JSON.stringify({
        level: 'warn',
        timestamp: new Date().toISOString(),
        message: args,
      }));
    }
  },

  error: (...args: unknown[]) => {
    if (!shouldLog('error')) { return; }
    const err = args[0];
    if (err instanceof Error) {
      console.error(JSON.stringify({
        level: 'error',
        timestamp: new Date().toISOString(),
        error: err.message,
        stack: err.stack,
        extra: args.slice(1),
      }));
    } else {
      console.error(JSON.stringify({
        level: 'error',
        timestamp: new Date().toISOString(),
        message: args,
      }));
    }
  },
};
