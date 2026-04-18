// Prisma client singleton for database operations
// Prevents multiple instances in development due to hot reloading
//
// Uses the Neon serverless adapter with WebSocket transport so connections
// go over port 443, avoiding firewall issues with direct PostgreSQL TCP.

import { PrismaClient } from '@/generated/prisma';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';
import { config } from '@/server/config';

// Use WebSockets in Node.js so connections go over port 443, not 5432.
neonConfig.webSocketConstructor = ws;

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// max: 3 — safe for 2 PM2 cluster workers (2 x 3 = 6, within Neon free tier limit of 10)
const adapter = new PrismaNeon({ connectionString: config.DATABASE_URL, max: 3 });
export const db = globalThis.prisma || new PrismaClient({ adapter });

/**
 * The transactional client type passed to interactive transaction callbacks.
 * Equivalent to PrismaClient minus methods that cannot run inside a transaction.
 */
type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>;

/**
 * Execute a callback inside a Prisma interactive transaction.
 * Ensures atomicity for multi-step DB operations.
 *
 * Usage:
 *   const result = await withTransaction(async (tx) => {
 *     const user = await tx.user.create({ data: { ... } });
 *     await tx.session.create({ data: { userId: user.id, ... } });
 *     return user;
 *   });
 */
export async function withTransaction<T>(
  fn: (tx: TransactionClient) => Promise<T>
): Promise<T> {
  return db.$transaction(fn);
}

// ── Graceful shutdown ─────────────────────────────────────────────────────
if (config.NODE_ENV === 'production') {
  // Inline shutdown handlers to avoid circular dependency and top-level await.
  // A separate shutdown.ts that imports db would create: db -> shutdown -> db.
  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) { return; }
    shuttingDown = true;
    console.log(`[Talkivo] ${signal} received — shutting down gracefully`);
    db.$disconnect()
      .then(() => { console.log('[Talkivo] Database disconnected'); process.exit(0); })
      .catch((err: unknown) => { console.error('[Talkivo] Error during shutdown:', err); process.exit(1); });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
} else {
  globalThis.prisma = db;
}
