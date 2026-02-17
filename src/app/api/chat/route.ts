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

async function handlePost(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    throw new Error('User ID not found in request');
  }

  const body = await validateBody(request, ChatRequestSchema);
  const { message, mode, level, sessionId, context, history } = body;

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
