import { NextRequest } from 'next/server';
import { chat } from '@/lib/groq';
import { getSystemPrompt } from '@/lib/prompts';
import { SCENARIOS } from '@/lib/config';
import { ChatRequestSchema } from '@/lib/schemas/chat.schema';
import {
  withAuth,
  validateBody,
  successResponse,
} from '@/lib/error-handler';
import { ApiError } from '@/lib/errors/ApiError';
import { db } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limiter';

const CHAT_RATE_LIMIT = { maxAttempts: 30, windowMs: 60 * 1000 };

async function handlePost(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    throw ApiError.unauthorized('User ID not found');
  }

  // Rate limit chat requests per user
  const rateLimit = checkRateLimit(`chat:${userId}`, CHAT_RATE_LIMIT);
  if (!rateLimit.allowed) {
    throw ApiError.rateLimited('Too many messages. Please slow down.');
  }

  const body = await validateBody(request, ChatRequestSchema);
  const { message, mode, level, sessionId, history } = body;

  // Sanitize user-controlled context fields (strip control characters)
  const sanitize = (s?: string) => s?.replace(/[\x00-\x1f\x7f]/g, '').trim();
  const context = body.context ? {
    ...body.context,
    topic: sanitize(body.context.topic),
    scenario: sanitize(body.context.scenario),
    character: sanitize(body.context.character),
    userRole: sanitize(body.context.userRole),
    debateTopic: sanitize(body.context.debateTopic),
    debatePosition: sanitize(body.context.debatePosition),
  } : undefined;

  // SECURITY: Verify session belongs to authenticated user
  if (sessionId) {
    const session = await db.session.findFirst({
      where: {
        id: sessionId,
        userId, // Verify ownership
      },
    });

    if (!session) {
      throw ApiError.notFound('Session');
    }
  }

  // Get the appropriate system prompt
  const systemPrompt = getSystemPrompt(mode, level, context, SCENARIOS);

  // Call Groq API
  const reply = await chat(systemPrompt, message, history || []);

  return successResponse({
    reply,
    sessionId,
  });
}

export const POST = withAuth(handlePost);
