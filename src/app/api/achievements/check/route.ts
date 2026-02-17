import { NextRequest } from 'next/server';
import { withAuth, successResponse } from '@/lib/error-handler';
import { AchievementChecker } from '@/lib/services/AchievementChecker';

export const POST = withAuth(async (request: NextRequest) => {
  const userId = request.headers.get('x-user-id')!;
  const newlyUnlocked = await AchievementChecker.checkAndUnlock(userId);
  return successResponse({ newlyUnlocked });
});
