// Zod schemas for Stats API validation

import { z } from 'zod';

// Period enum
export const PeriodSchema = z.enum(['7d', '30d', '90d', 'all']).default('30d');

// Stats query params schema
// Note: userId comes from x-user-id header (set by withAuth), not from query params
export const StatsQuerySchema = z.object({
  period: PeriodSchema,
});

// Progress query params schema
// Note: userId comes from x-user-id header (set by withAuth), not from query params
export const ProgressQuerySchema = z.object({
  period: PeriodSchema,
});

// Type exports
export type StatsQuery = z.infer<typeof StatsQuerySchema>;
export type ProgressQuery = z.infer<typeof ProgressQuerySchema>;
export type Period = z.infer<typeof PeriodSchema>;
