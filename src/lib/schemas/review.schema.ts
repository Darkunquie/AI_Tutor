import { z } from 'zod';

export const ReviewResultSchema = z.object({
  correct: z.boolean(),
});
