// Zod schemas for Session API validation

import { z } from 'zod';
import { LevelSchema, ModeSchema } from './chat.schema';

// Create session request schema
export const CreateSessionSchema = z.object({
  userId: z.string().optional(),
  mode: ModeSchema,
  level: LevelSchema,
});

// Filler word detail schema
export const FillerWordDetailSchema = z.object({
  word: z.string(),
  count: z.number().int().min(0),
  positions: z.array(z.number().int()),
});

// Update session request schema
export const UpdateSessionSchema = z.object({
  duration: z.number().int().min(0).optional(),
  score: z.number().int().min(0).max(100).optional(),
  fillerWordCount: z.number().int().min(0).optional(),
  fillerDetails: z.array(FillerWordDetailSchema).optional(),
  avgPronunciation: z.number().min(0).max(100).optional(),
  vocabularyJson: z.array(z.string()).optional(),
});

// Session query params schema
export const SessionQuerySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

// Type exports
export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export type UpdateSessionInput = z.infer<typeof UpdateSessionSchema>;
export type SessionQuery = z.infer<typeof SessionQuerySchema>;
