import { messageRepo } from '@/server/repositories/MessageRepository';
import { sessionRepo } from '@/server/repositories/SessionRepository';
import { chatStream, chat } from '@/lib/groq';
import { getSystemPrompt } from '@/lib/prompts';
import { SCENARIOS } from '@/lib/config';
import { logger } from '@/server/infra/logger';
import type { ChatContext, Mode, Level } from '@/lib/types';

export const chatService = {
  /**
   * Non-streaming turn: saves user message, calls Groq, saves AI message, returns reply.
   */
  async turn(params: {
    userId: string;
    sessionId: string;
    message: string;
    mode: Mode;
    level: Level;
    context?: ChatContext;
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }) {
    // 1. Verify session ownership
    const session = await sessionRepo.findForUser(params.sessionId, params.userId);
    if (!session) { throw new Error('SESSION_NOT_FOUND'); }

    // 2. Save user message
    await messageRepo.createUserMessage({
      sessionId: params.sessionId,
      content: params.message,
    });

    // 3. Build system prompt and call Groq
    const systemPrompt = getSystemPrompt(params.mode, params.level, params.context, SCENARIOS);
    const trimmedHistory = (params.history || []).slice(-20);
    const reply = await chat(systemPrompt, params.message, trimmedHistory, params.userId);

    // 4. Save AI message
    if (reply.trim()) {
      await messageRepo.createAiMessage({
        sessionId: params.sessionId,
        content: reply,
      });
    }

    logger.debug('Chat turn completed', { sessionId: params.sessionId, userId: params.userId });
    return { reply, sessionId: params.sessionId };
  },

  /**
   * Streaming turn: saves user message, streams from Groq, saves AI message after stream completes.
   * Returns an async generator of tokens.
   */
  async *streamTurn(params: {
    userId: string;
    sessionId: string;
    message: string;
    mode: Mode;
    level: Level;
    context?: ChatContext;
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): AsyncGenerator<string> {
    // 1. Verify session ownership
    const session = await sessionRepo.findForUser(params.sessionId, params.userId);
    if (!session) { throw new Error('SESSION_NOT_FOUND'); }

    // 2. Save user message
    await messageRepo.createUserMessage({
      sessionId: params.sessionId,
      content: params.message,
    });

    // 3. Stream from Groq, accumulate full response
    const systemPrompt = getSystemPrompt(params.mode, params.level, params.context, SCENARIOS);
    const trimmedHistory = (params.history || []).slice(-20);
    let fullReply = '';

    try {
      for await (const token of chatStream(systemPrompt, params.message, trimmedHistory, params.userId)) {
        fullReply += token;
        yield token;
      }
    } finally {
      // Save whatever was accumulated, even if caller aborted early
      if (fullReply.trim()) {
        await messageRepo.createAiMessage({
          sessionId: params.sessionId,
          content: fullReply,
        });
      }
      logger.info('Chat stream turn completed', {
        sessionId: params.sessionId,
        userId: params.userId,
        partial: fullReply.length > 0,
      });
    }
  },
};
