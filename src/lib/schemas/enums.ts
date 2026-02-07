// Single source of truth for all enum values.
// TypeScript types are derived from Zod schemas via z.infer.

import { z } from 'zod';

export const LevelSchema = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);
export type Level = z.infer<typeof LevelSchema>;

export const ModeSchema = z.enum(['FREE_TALK', 'ROLE_PLAY', 'DEBATE', 'GRAMMAR_FIX']);
export type Mode = z.infer<typeof ModeSchema>;

export const RoleSchema = z.enum(['USER', 'AI']);
export type Role = z.infer<typeof RoleSchema>;

export const ErrorTypeSchema = z.enum(['GRAMMAR', 'VOCABULARY', 'STRUCTURE', 'FLUENCY']);
export type ErrorType = z.infer<typeof ErrorTypeSchema>;

export const VocabSourceSchema = z.enum(['CORRECTION', 'AI_RESPONSE', 'USER_MARKED']);
export type VocabSource = z.infer<typeof VocabSourceSchema>;
