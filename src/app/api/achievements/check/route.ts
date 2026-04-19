import { NextRequest } from 'next/server';
import { withErrorHandling, successResponse } from '@/lib/error-handler';
import { requireAuth } from '@/server/http/auth-context';
import { AchievementChecker } from '@/lib/services/AchievementChecker';
import { logger } from '@/server/infra/logger';

// POST /api/achievements/check
// Runs achievement check and returns newly unlocked types.
// Also called server-side by SessionService after session end.
async function handlePost(request: NextRequest) {
  const ctx = await requireAuth(request);
  const userId = ctx.userId;

  const newlyUnlocked = await AchievementChecker.checkAndUnlock(userId);

  if (newlyUnlocked.length > 0) {
    logger.info('Achievements unlocked via check endpoint', { achievements: newlyUnlocked });
  }

  return successResponse({ newlyUnlocked });
}

export const POST = withErrorHandling(handlePost);
