import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withErrorHandling, successResponse, validateBody } from '@/lib/error-handler';
import { StreakCalculator } from '@/lib/services/StreakCalculator';
import { requireAuth } from '@/server/http/auth-context';

const UpdateGoalSchema = z.object({
  dailyGoalMinutes: z.number().int().min(5).max(120),
});

async function handleGet(request: NextRequest) {
  const ctx = await requireAuth(request);
  const userId = ctx.userId;
  const data = await StreakCalculator.getStreakData(userId);
  return successResponse(data);
}

async function handlePatch(request: NextRequest) {
  const ctx = await requireAuth(request);
  const userId = ctx.userId;
  const { dailyGoalMinutes } = await validateBody(request, UpdateGoalSchema);

  await db.user.update({
    where: { id: userId },
    data: { dailyGoalMinutes },
  });

  return successResponse({ dailyGoalMinutes });
}

export const GET = withErrorHandling(handleGet);
export const PATCH = withErrorHandling(handlePatch);
