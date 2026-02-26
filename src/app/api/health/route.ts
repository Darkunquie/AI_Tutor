import { db } from '@/lib/db';

const startTime = Date.now();

export async function GET() {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const mem = process.memoryUsage();

  try {
    // Verify database connectivity and measure latency
    const dbStart = Date.now();
    await db.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    return Response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime,
      version: process.env.npm_package_version || '0.1.0',
      node: process.version,
      memory: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heap: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      },
      db: {
        status: 'connected',
        latency: dbLatency,
      },
    });
  } catch {
    return Response.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime,
        memory: {
          rss: Math.round(mem.rss / 1024 / 1024),
          heap: Math.round(mem.heapUsed / 1024 / 1024),
        },
        db: { status: 'disconnected' },
      },
      { status: 503 }
    );
  }
}
