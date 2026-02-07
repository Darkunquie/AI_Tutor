// Zod schemas for Stats API validation

import { z } from 'zod';

// Period enum
export const PeriodSchema = z.enum(['7d', '30d', '90d', 'all']).default('30d');

// Stats query params schema
export const StatsQuerySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  period: PeriodSchema,
});

// Progress query params schema
export const ProgressQuerySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  period: PeriodSchema,
});

// Type exports
export type StatsQuery = z.infer<typeof StatsQuerySchema>;
export type ProgressQuery = z.infer<typeof ProgressQuerySchema>;
export type Period = z.infer<typeof PeriodSchema>;
