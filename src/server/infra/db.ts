// Prisma client singleton for database operations
// Prevents multiple instances in development due to hot reloading
// Uses @prisma/adapter-pg for standard PostgreSQL connection

import { PrismaClient } from '@/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { config } from '@/server/config';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const pool = new Pool({ connectionString: config.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const db = globalThis.prisma || new PrismaClient({ adapter });

/**
 * The transactional client type passed to interactive transaction callbacks.
 */
type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>;

/**
 * Execute a callback inside a Prisma interactive transaction.
 */
export async function withTransaction<T>(
  fn: (tx: TransactionClient) => Promise<T>
): Promise<T> {
  return db.$transaction(fn);
}

// ── Graceful shutdown ─────────────────────────────────────────────────────
if (config.NODE_ENV === 'production') {
  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) { return; }
    shuttingDown = true;
    console.log(`[Talkivo] ${signal} received — shutting down gracefully`);
    db.$disconnect()
      .then(() => pool.end())
      .then(() => { console.log('[Talkivo] Database disconnected'); process.exit(0); })
      .catch((err: unknown) => { console.error('[Talkivo] Error during shutdown:', err); process.exit(1); });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
} else {
  globalThis.prisma = db;
}
