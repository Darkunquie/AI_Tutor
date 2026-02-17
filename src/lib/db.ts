// Prisma client singleton for database operations
// Prevents multiple instances in development due to hot reloading

import { PrismaClient } from '@/generated/prisma';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create SQLite adapter for Prisma 7 - uses DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL || (
  process.env.NODE_ENV === 'production'
    ? (() => { throw new Error('DATABASE_URL environment variable is required in production'); })()
    : 'file:./prisma/dev.db'
);
const adapter = new PrismaBetterSqlite3({ url: DATABASE_URL as string });

export const db = globalThis.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db;
}
