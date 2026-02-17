import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, successResponse, validateBody } from '@/lib/error-handler';
import { StreakCalculator } from '@/lib/services/StreakCalculator';

const UpdateGoalSchema = z.object({
  dailyGoalMinutes: z.number().int().min(5).max(120),
});

export const GET = withAuth(async (request: NextRequest) => {
  const userId = request.headers.get('x-user-id')!;
  const data = await StreakCalculator.getStreakData(userId);
  return successResponse(data);
});

export const PATCH = withAuth(async (request: NextRequest) => {
  const userId = request.headers.get('x-user-id')!;
  const { dailyGoalMinutes } = await validateBody(request, UpdateGoalSchema);

  await db.user.update({
    where: { id: userId },
    data: { dailyGoalMinutes },
  });

  return successResponse({ dailyGoalMinutes });
});
