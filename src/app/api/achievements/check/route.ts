import { NextRequest } from 'next/server';
import { withErrorHandling, successResponse } from '@/lib/error-handler';
import { AchievementChecker } from '@/lib/services/AchievementChecker';
import { requireAuth } from '@/server/http/auth-context';

async function handlePost(request: NextRequest) {
  const ctx = await requireAuth(request);
  const userId = ctx.userId;
  const newlyUnlocked = await AchievementChecker.checkAndUnlock(userId);
  return successResponse({ newlyUnlocked });
}

export const POST = withErrorHandling(handlePost);
