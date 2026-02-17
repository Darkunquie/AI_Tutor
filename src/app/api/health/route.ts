import { db } from '@/lib/db';

export async function GET() {
  try {
    // Verify database connectivity
    await db.$queryRaw`SELECT 1`;

    return Response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      { status: 'error', message: 'Database connection failed' },
      { status: 503 }
    );
  }
}
