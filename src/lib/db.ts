// Prisma client singleton for database operations
// Prevents multiple instances in development due to hot reloading

import { PrismaClient } from '@/generated/prisma';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';
import { env } from './env';

// Use WebSockets in Node.js so connections go over port 443, not 5432.
// This avoids firewall issues common with direct PostgreSQL TCP connections.
neonConfig.webSocketConstructor = ws;

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const adapter = new PrismaNeon({ connectionString: env.DATABASE_URL, max: 5 });
export const db = globalThis.prisma || new PrismaClient({ adapter });

if (env.NODE_ENV === 'production') {
  // Inline shutdown handlers to avoid circular dependency and top-level await.
  // A separate shutdown.ts that imports db would create: db → shutdown → db.
  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[Talkivo] ${signal} received — shutting down gracefully`);
    db.$disconnect()
      .then(() => { console.log('[Talkivo] Database disconnected'); process.exit(0); })
      .catch((err: unknown) => { console.error('[Talkivo] Error during shutdown:', err); process.exit(1); });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
} else {
  globalThis.prisma = db;
}
