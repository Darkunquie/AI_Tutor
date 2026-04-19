import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { UpdateSessionSchema } from '@/lib/schemas/session.schema';
import { ApiError } from '@/lib/errors/ApiError';
import {
  withErrorHandling,
  validateBody,
  successResponse,
} from '@/lib/error-handler';
import { safeJsonParse } from '@/lib/utils';
import { requireAuth } from '@/server/http/auth-context';
import { sessionService } from '@/server/services/SessionService';

// GET /api/sessions/[id] - Get a specific session
async function handleGet(request: NextRequest, context?: { params: Promise<Record<string, string>> }) {
  const ctx = await requireAuth(request);
  const userId = ctx.userId;

  const params = context!.params;
  const { id } = await params;

  // SECURITY: Only fetch session if it belongs to authenticated user
  const session = await db.session.findFirst({
    where: {
      id,
      userId, // Verify ownership
    },
    include: {
      messages: {
        orderBy: { timestamp: 'asc' },
      },
      errors: true,
      vocabulary: true,
    },
  });

  if (!session) {
    throw ApiError.notFound('Session');
  }

  return successResponse({
    id: session.id,
    mode: session.mode,
    level: session.level,
    duration: session.duration,
    score: session.score,
    fillerWordCount: session.fillerWordCount,
    avgPronunciation: session.avgPronunciation,
    vocabulary: session.vocabulary,
    messages: session.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      corrections: safeJsonParse(m.corrections, null),
      pronunciationScore: m.pronunciationScore,
      fillerWordCount: m.fillerWordCount,
      timestamp: m.timestamp,
    })),
    errors: session.errors,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  });
}

// PATCH /api/sessions/[id] - Update/end a session
async function handlePatch(request: NextRequest, context?: { params: Promise<Record<string, string>> }) {
  const ctx = await requireAuth(request);
  const { id } = await context!.params;
  const body = await validateBody(request, UpdateSessionSchema);

  const session = await sessionService.endSession(id, ctx.userId, body);

  return successResponse({
    id: session.id,
    duration: session.duration,
    score: session.score,
    fillerWordCount: session.fillerWordCount,
    avgPronunciation: session.avgPronunciation,
    updatedAt: session.updatedAt,
  });
}

export const GET = withErrorHandling(handleGet);
export const PATCH = withErrorHandling(handlePatch);
