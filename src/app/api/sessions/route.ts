import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { CreateSessionSchema, SessionQuerySchema } from '@/lib/schemas/session.schema';
import {
  withErrorHandling,
  validateBody,
  validateQuery,
  successResponse,
  paginatedResponse,
} from '@/lib/error-handler';
import { requireAuth } from '@/server/http/auth-context';

// POST /api/sessions - Create a new session
async function handlePost(request: NextRequest) {
  const ctx = await requireAuth(request);
  const userId = ctx.userId;

  const body = await validateBody(request, CreateSessionSchema);
  const { mode, level } = body;

  // Create the session
  const session = await db.session.create({
    data: {
      userId,
      mode: mode,
      level: level,
      duration: 0,
      score: null,
      fillerWordCount: 0,
      fillerDetails: '[]',
      vocabularyJson: '[]',
    },
  });

  return successResponse({
    sessionId: session.id,
    userId,
  });
}

// GET /api/sessions - Get sessions for a user
async function handleGet(request: NextRequest) {
  const ctx = await requireAuth(request);
  const userId = ctx.userId;

  const query = validateQuery(request, SessionQuerySchema);
  const { page = 1, pageSize = 10 } = query;

  // Get total count
  const total = await db.session.count({
    where: { userId },
  });

  // Get paginated sessions
  const sessions = await db.session.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      _count: {
        select: { messages: true, errors: true },
      },
    },
  });

  return paginatedResponse(
    sessions.map((s) => ({
      id: s.id,
      mode: s.mode,
      level: s.level,
      duration: s.duration,
      score: s.score,
      fillerWordCount: s.fillerWordCount,
      avgPronunciation: s.avgPronunciation,
      messageCount: s._count.messages,
      errorCount: s._count.errors,
      createdAt: s.createdAt,
    })),
    total,
    page,
    pageSize
  );
}

export const POST = withErrorHandling(handlePost);
export const GET = withErrorHandling(handleGet);
