import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { SaveMessageSchema } from '@/lib/schemas/message.schema';
import { ApiError } from '@/lib/errors/ApiError';
import {
  withAuth,
  validateBody,
  validateQuery,
  successResponse,
} from '@/lib/error-handler';
import { safeJsonParse } from '@/lib/utils';

// Query schema for GET
const MessageQuerySchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

// POST /api/messages - Save a message
async function handlePost(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    throw ApiError.unauthorized('User ID not found');
  }

  const body = await validateBody(request, SaveMessageSchema);
  const {
    sessionId,
    role,
    content,
    corrections,
    pronunciationScore,
    fillerWordCount,
  } = body;

  // SECURITY: Verify session exists and belongs to authenticated user
  const session = await db.session.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    throw ApiError.notFound('Session');
  }

  // Create the message
  const message = await db.message.create({
    data: {
      sessionId,
      role,
      content,
      corrections: corrections ? JSON.stringify(corrections) : null,
      pronunciationScore,
      fillerWordCount: fillerWordCount || 0,
    },
  });

  // If there are corrections, also save them as errors for tracking
  if (corrections && corrections.length > 0) {
    await db.error.createMany({
      data: corrections.map((c) => ({
        sessionId,
        category: c.type,
        original: c.original,
        corrected: c.corrected,
        explanation: c.explanation,
      })),
    });
  }

  // Update session filler word count if this is a user message
  if (role === 'USER' && fillerWordCount && fillerWordCount > 0) {
    await db.session.update({
      where: { id: sessionId },
      data: {
        fillerWordCount: {
          increment: fillerWordCount,
        },
      },
    });
  }

  return successResponse({
    id: message.id,
    role: message.role,
    content: message.content,
    corrections: corrections || null,
    pronunciationScore: message.pronunciationScore,
    fillerWordCount: message.fillerWordCount,
    timestamp: message.timestamp,
  });
}

// GET /api/messages - Get messages for a session
async function handleGet(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    throw ApiError.unauthorized('User ID not found');
  }

  const query = validateQuery(request, MessageQuerySchema);
  const { sessionId } = query;

  // SECURITY: Verify session belongs to authenticated user before returning messages
  const session = await db.session.findFirst({
    where: {
      id: sessionId,
      userId, // Verify ownership
    },
  });

  if (!session) {
    throw ApiError.notFound('Session');
  }

  const messages = await db.message.findMany({
    where: { sessionId },
    orderBy: { timestamp: 'asc' },
  });

  return successResponse({
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      corrections: safeJsonParse(m.corrections, null),
      pronunciationScore: m.pronunciationScore,
      fillerWordCount: m.fillerWordCount,
      timestamp: m.timestamp,
    })),
  });
}

export const POST = withAuth(handlePost);
export const GET = withAuth(handleGet);
