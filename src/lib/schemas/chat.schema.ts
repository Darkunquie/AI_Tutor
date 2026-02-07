// Zod schemas for Chat API validation

import { z } from 'zod';
import { LevelSchema, ModeSchema, RoleSchema, ErrorTypeSchema } from './enums';

export { LevelSchema, ModeSchema, RoleSchema, ErrorTypeSchema };

// Chat context schema
export const ChatContextSchema = z.object({
  topic: z.string().optional(),
  scenario: z.string().optional(),
  character: z.string().optional(),
  userRole: z.string().optional(),
  debateTopic: z.string().optional(),
  debatePosition: z.string().optional(),
}).optional();

// Chat history item schema
export const ChatHistoryItemSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

// Chat request schema
export const ChatRequestSchema = z.object({
  message: z.string()
    .min(1, 'Message is required')
    .max(5000, 'Message is too long (max 5000 characters)'),
  mode: ModeSchema,
  level: LevelSchema,
  sessionId: z.string().min(1, 'Session ID is required'),
  context: ChatContextSchema,
  history: z.array(ChatHistoryItemSchema).default([]),
});

// Correction schema
export const CorrectionSchema = z.object({
  type: ErrorTypeSchema,
  original: z.string(),
  corrected: z.string(),
  explanation: z.string(),
});

// Chat response schema (for validation of outgoing data)
export const ChatResponseSchema = z.object({
  reply: z.string(),
  corrections: z.array(CorrectionSchema),
  sessionId: z.string(),
});

// Type exports
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
export type Correction = z.infer<typeof CorrectionSchema>;
export type ChatContext = z.infer<typeof ChatContextSchema>;
export type ChatHistoryItem = z.infer<typeof ChatHistoryItemSchema>;
