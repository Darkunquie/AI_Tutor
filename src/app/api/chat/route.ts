import { NextRequest } from 'next/server';
import { ChatRequestSchema } from '@/lib/schemas/chat.schema';
import {
  withErrorHandling,
  validateBody,
} from '@/lib/error-handler';
import { ApiError } from '@/lib/errors/ApiError';
import { checkRateLimit } from '@/lib/rate-limiter';
import { requireAuth } from '@/server/http/auth-context';
import { chatService } from '@/server/services/ChatService';
import { logger } from '@/server/infra/logger';

const CHAT_RATE_LIMIT = { maxAttempts: 30, windowMs: 60 * 1000 };

async function handlePost(request: NextRequest) {
  const ctx = await requireAuth(request);
  const userId = ctx.userId;

  // Rate limit chat requests per user
  const rateLimit = await checkRateLimit(`chat:${userId}`, CHAT_RATE_LIMIT);
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

  // Check if client wants streaming
  const acceptsStream = request.headers.get('accept')?.includes('text/event-stream');

  if (acceptsStream) {
    // Streaming response via SSE — ChatService persists both user + AI messages
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const token of chatService.streamTurn({
            userId,
            sessionId,
            message,
            mode,
            level,
            context,
            history,
          })) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, sessionId })}\n\n`));
          controller.close();
        } catch (error) {
          logger.error('Chat stream error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }

  // Non-streaming fallback — ChatService persists both user + AI messages
  const result = await chatService.turn({
    userId,
    sessionId,
    message,
    mode,
    level,
    context,
    history,
  });

  return Response.json({
    data: { reply: result.reply, sessionId: result.sessionId },
  });
}

export const POST = withErrorHandling(handlePost);
