import { NextRequest } from 'next/server';
import { withAuth, successResponse } from '@/lib/error-handler';
import { AchievementChecker } from '@/lib/services/AchievementChecker';
import { ApiError } from '@/lib/errors/ApiError';

export const POST = withAuth(async (request: NextRequest) => {
  const userId = request.headers.get('x-user-id');
  if (!userId) { throw ApiError.unauthorized('User ID not found'); }
  const newlyUnlocked = await AchievementChecker.checkAndUnlock(userId);
  return successResponse({ newlyUnlocked });
});
