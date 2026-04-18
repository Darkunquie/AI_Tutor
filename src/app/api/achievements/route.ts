import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling, successResponse } from '@/lib/error-handler';
import { ACHIEVEMENTS } from '@/lib/config/achievements';
import { requireAuth } from '@/server/http/auth-context';

async function handleGet(request: NextRequest) {
  const ctx = await requireAuth(request);
  const userId = ctx.userId;

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
}

export const GET = withErrorHandling(handleGet);
