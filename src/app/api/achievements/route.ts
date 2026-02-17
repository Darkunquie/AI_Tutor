import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, successResponse } from '@/lib/error-handler';
import { ACHIEVEMENTS } from '@/lib/config/achievements';

export const GET = withAuth(async (request: NextRequest) => {
  const userId = request.headers.get('x-user-id')!;

  const userAchievements = await db.achievement.findMany({
    where: { userId },
    select: { type: true, unlockedAt: true },
  });

  const unlockedMap = new Map(
    userAchievements.map(a => [a.type, a.unlockedAt.toISOString()])
  );

  const unlocked = ACHIEVEMENTS
    .filter(a => unlockedMap.has(a.type))
    .map(a => ({ ...a, unlockedAt: unlockedMap.get(a.type) }));

  const locked = ACHIEVEMENTS
    .filter(a => !unlockedMap.has(a.type))
    .map(a => ({ ...a }));

  return successResponse({ unlocked, locked });
});
