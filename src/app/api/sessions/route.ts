import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { CreateSessionSchema, SessionQuerySchema } from '@/lib/schemas/session.schema';
import { ApiError } from '@/lib/errors/ApiError';
import {
  withAuth,
  validateBody,
  validateQuery,
  successResponse,
  paginatedResponse,
} from '@/lib/error-handler';

// POST /api/sessions - Create a new session
async function handlePost(request: NextRequest) {
  const body = await validateBody(request, CreateSessionSchema);
  const { mode, level } = body;

  // Get authenticated user ID from middleware headers
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    throw ApiError.unauthorized('User ID not found');
  }

  // Verify user exists
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw ApiError.notFound('User');
  }

  // Create the session
  const session = await db.session.create({
    data: {
      userId: user.id,
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
    userId: user.id,
  });
}

// GET /api/sessions - Get sessions for a user
async function handleGet(request: NextRequest) {
  const query = validateQuery(request, SessionQuerySchema);
  const { page = 1, pageSize = 10 } = query;

  // Get authenticated user ID from middleware headers
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    throw ApiError.unauthorized('User ID not found');
  }

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

export const POST = withAuth(handlePost);
export const GET = withAuth(handleGet);
