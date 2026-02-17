// Zod schemas for Message API validation

import { z } from 'zod';
import { RoleSchema, CorrectionSchema } from './chat.schema';

// Save message request schema
export const SaveMessageSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  role: RoleSchema,
  content: z.string().min(1, 'Message content is required').max(10000),
  corrections: z.array(CorrectionSchema).optional(),
  pronunciationScore: z.number().min(0).max(100).optional(),
  fillerWordCount: z.number().int().min(0).optional(),
});

// Message query params schema
export const MessageQuerySchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

// Type exports
export type SaveMessageInput = z.infer<typeof SaveMessageSchema>;
export type MessageQuery = z.infer<typeof MessageQuerySchema>;
