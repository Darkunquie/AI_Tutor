// Centralized environment variable validation
// Validates all required env vars at module load time.
// If any are missing, the process crashes immediately with a clear error.

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      `Set it in .env or your system environment.`
    );
  }
  return value.trim();
}

export const env = {
  DATABASE_URL: requireEnv('DATABASE_URL'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  GROQ_API_KEY: requireEnv('GROQ_API_KEY'),
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;
