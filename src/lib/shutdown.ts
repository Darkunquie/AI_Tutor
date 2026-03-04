// Graceful shutdown handler for production
// Disconnects Prisma on SIGTERM/SIGINT so in-flight queries finish cleanly.
// PM2 sends SIGTERM with kill_timeout: 5000ms — this handler ensures we
// close the database pool within that window.

import { db } from './db';

let shuttingDown = false;

function handleShutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`[Talkivo] ${signal} received — shutting down gracefully`);

  db.$disconnect()
    .then(() => {
      console.log('[Talkivo] Database disconnected');
      process.exit(0);
    })
    .catch((err: unknown) => {
      console.error('[Talkivo] Error during shutdown:', err);
      process.exit(1);
    });
}

export function registerShutdownHandlers() {
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}
