import { db } from '@/lib/db';
import { getActiveGroqRequests } from '@/lib/groq';

export async function GET() {
  const mem = process.memoryUsage();

  try {
    const dbStart = Date.now();
    await db.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    return Response.json({
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      memory: {
        rss: Math.round(mem.rss / 1024 / 1024) + 'MB',
        heap: Math.round(mem.heapUsed / 1024 / 1024) + 'MB',
      },
      groqQueue: getActiveGroqRequests(),
      db: { status: 'connected', latency: dbLatency },
      timestamp: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      {
        status: 'error',
        uptime: Math.floor(process.uptime()),
        memory: {
          rss: Math.round(mem.rss / 1024 / 1024) + 'MB',
          heap: Math.round(mem.heapUsed / 1024 / 1024) + 'MB',
        },
        groqQueue: getActiveGroqRequests(),
        db: { status: 'disconnected' },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
