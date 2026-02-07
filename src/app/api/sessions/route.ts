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

// POST /api/sessions - Create a new session
async function handlePost(request: NextRequest) {
  const body = await validateBody(request, CreateSessionSchema);
  const { userId, mode, level } = body;

  // Use a default user ID if not provided (for anonymous users)
  // In production, this would come from authentication
  const effectiveUserId = userId || 'anonymous';

  // Create or find the user
  let user = await db.user.findUnique({
    where: { lmsUserId: effectiveUserId },
  });

  if (!user) {
    user = await db.user.create({
      data: {
        lmsUserId: effectiveUserId,
        level: level,
      },
    });
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
  const { userId, page = 1, pageSize = 10 } = query;

  // Find user by lmsUserId
  const user = await db.user.findUnique({
    where: { lmsUserId: userId },
  });

  if (!user) {
    return paginatedResponse([], 0, page, pageSize);
  }

  // Get total count
  const total = await db.session.count({
    where: { userId: user.id },
  });

  // Get paginated sessions
  const sessions = await db.session.findMany({
    where: { userId: user.id },
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
