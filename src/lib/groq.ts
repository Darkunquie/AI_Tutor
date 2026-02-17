// Groq API client for Talkivo
// Using Llama 3.3 70B - completely free!

import Groq from 'groq-sdk';
import { logger } from './utils';

if (!process.env.GROQ_API_KEY?.trim()) {
  throw new Error(
    'GROQ_API_KEY environment variable is not set. Get a free key at https://console.groq.com'
  );
}

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_TIMEOUT = 30000; // 30 seconds

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  timeout: GROQ_TIMEOUT,
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chat(
  systemPrompt: string,
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from AI model');
    }

    return content;
  } catch (error: unknown) {
    logger.error('Groq API error:', error);
    // Handle rate limiting specifically
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 429) {
      throw new Error('AI service is busy. Please wait a moment and try again.');
    }
    throw new Error('Failed to get response from AI. Please try again.');
  }
}

// For streaming responses (optional, for better UX)
export async function* chatStream(
  systemPrompt: string,
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): AsyncGenerator<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  try {
    const stream = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    logger.error('Groq API streaming error:', error);
    throw new Error('Failed to get response from AI. Please try again.');
  }
}
