import { db } from '@/lib/db';

export async function GET() {
  try {
    const dbStart = Date.now();
    await db.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    return Response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: { status: 'connected', latency: dbLatency },
    });
  } catch {
    return Response.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        db: { status: 'disconnected' },
      },
      { status: 503 }
    );
  }
}
