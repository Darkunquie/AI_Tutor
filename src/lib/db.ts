// Prisma client singleton for database operations
// Prevents multiple instances in development due to hot reloading
// Uses @prisma/adapter-pg for standard PostgreSQL connection

import { PrismaClient } from '@/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
export const db = globalThis.prisma || new PrismaClient({ adapter });

if (env.NODE_ENV === 'production') {
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
