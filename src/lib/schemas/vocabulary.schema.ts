// Zod schemas for Vocabulary API validation

import { z } from 'zod';
import { VocabSourceSchema } from './enums';

export { VocabSourceSchema };

// Save vocabulary request schema
// Note: userId comes from x-user-id header (set by withAuth), not from request body
export const SaveVocabularySchema = z.object({
  sessionId: z.string().optional(),
  word: z.string()
    .min(1, 'Word is required')
    .max(100, 'Word is too long'),
  definition: z.string().max(500).optional(),
  context: z.string()
    .min(1, 'Context is required')
    .max(1000, 'Context is too long'),
  source: VocabSourceSchema,
});

// Update vocabulary request schema
export const UpdateVocabularySchema = z.object({
  definition: z.string().max(500).optional(),
  mastery: z.number().int().min(0).max(100).optional(),
});

// Vocabulary query params schema
// Note: userId comes from x-user-id header (set by withAuth), not from query params
export const VocabularyQuerySchema = z.object({
  search: z.string().optional(),
  source: VocabSourceSchema.optional(),
  sortBy: z.enum(['createdAt', 'word', 'mastery']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Type exports
export type SaveVocabularyInput = z.infer<typeof SaveVocabularySchema>;
export type UpdateVocabularyInput = z.infer<typeof UpdateVocabularySchema>;
export type VocabularyQuery = z.infer<typeof VocabularyQuerySchema>;
