import { NextRequest } from 'next/server';
import { withErrorHandling, successResponse } from '@/lib/error-handler';
import { requireAuth } from '@/server/http/auth-context';
import { achievementRepo } from '@/server/repositories/AchievementRepository';
import { logger } from '@/server/infra/logger';

// POST /api/achievements/check
// Achievement checking now happens automatically in SessionService after session end.
// This endpoint is kept for backward compatibility — it returns current achievements
// without running the heavy check logic.
async function handlePost(request: NextRequest) {
  const ctx = await requireAuth(request);
  const userId = ctx.userId;

  logger.info('Achievement check endpoint called (lightweight mode)', { userId });

  const achievements = await achievementRepo.findTypesByUser(userId);
  const types = achievements.map((a) => a.type);

  return successResponse({ newlyUnlocked: [], achievements: types });
}

export const POST = withErrorHandling(handlePost);
