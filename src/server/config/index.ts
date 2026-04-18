// Centralized, Zod-validated configuration
// Replaces src/lib/env.ts — validates all env vars at module load time.
// If any required var is missing or invalid, the process crashes with a clear error.

import { z } from 'zod';

const configSchema = z.object({
  // Database — Neon PostgreSQL connection string (postgresql:// scheme, not a valid URL)
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Auth — JWT signing secret (minimum 32 chars for security)
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

  // AI — Groq API
  GROQ_API_KEY: z.string().min(1, 'GROQ_API_KEY is required'),
  GROQ_MODEL: z.string().default('llama-3.3-70b-versatile'),
  GROQ_MAX_CONCURRENT: z.coerce.number().int().positive().default(25),

  // Redis — Upstash (optional; falls back to in-memory rate limiting)
  REDIS_URL: z.string().optional(),
  REDIS_TOKEN: z.string().optional(),

  // Runtime
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export const config = configSchema.parse(process.env);
export type Config = z.infer<typeof configSchema>;
