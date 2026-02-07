import { NextRequest } from 'next/server';
import { chat } from '@/lib/groq';
import { getSystemPrompt } from '@/lib/prompts';
import { SCENARIOS } from '@/lib/config';
import { ChatRequestSchema } from '@/lib/schemas/chat.schema';
import {
  withErrorHandling,
  validateBody,
  successResponse,
} from '@/lib/error-handler';

async function handlePost(request: NextRequest) {
  const body = await validateBody(request, ChatRequestSchema);
  const { message, mode, level, sessionId, context, history } = body;

  // Get the appropriate system prompt
  const systemPrompt = getSystemPrompt(mode, level, context, SCENARIOS);

  // Call Groq API
  const reply = await chat(systemPrompt, message, history || []);

  return successResponse({
    reply,
    sessionId,
  });
}

export const POST = withErrorHandling(handlePost);
