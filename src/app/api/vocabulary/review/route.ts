import { NextRequest } from 'next/server';
import { db } from '@/server/infra/db';
import { withErrorHandling, successResponse } from '@/lib/error-handler';
import { requireAuth } from '@/server/http/auth-context';

async function handleGet(request: NextRequest) {
  const ctx = await requireAuth(request);
  const userId = ctx.userId;

  const limit = Math.min(
    50,
    Math.max(1, Number(request.nextUrl.searchParams.get('limit')) || 20)
  );

  const now = new Date();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Pre-compute interval thresholds so filtering happens in the DB, not in JS.
  // This avoids loading all vocabulary into memory for users with large word lists.
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
  const dueWhere = {
    userId,
    OR: [
      { reviewedAt: null },
      { AND: [{ mastery: { lte: 20 } },  { reviewedAt: { lte: daysAgo(1) } }] },
      { AND: [{ mastery: { gt: 20, lte: 40 } }, { reviewedAt: { lte: daysAgo(3) } }] },
      { AND: [{ mastery: { gt: 40, lte: 60 } }, { reviewedAt: { lte: daysAgo(7) } }] },
      { AND: [{ mastery: { gt: 60, lte: 80 } }, { reviewedAt: { lte: daysAgo(14) } }] },
      { AND: [{ mastery: { gt: 80 } },  { reviewedAt: { lte: daysAgo(30) } }] },
    ],
  };

  const [words, totalDue, totalWords, reviewedToday] = await Promise.all([
    db.vocabulary.findMany({
      where: dueWhere,
      select: {
        id: true,
        word: true,
        definition: true,
        context: true,
        mastery: true,
        reviewedAt: true,
      },
      orderBy: [{ mastery: 'asc' }, { reviewedAt: 'asc' }],
      take: limit,
    }),
    db.vocabulary.count({ where: dueWhere }),
    db.vocabulary.count({ where: { userId } }),
    db.vocabulary.count({ where: { userId, reviewedAt: { gte: todayStart } } }),
  ]);

  return successResponse({
    words: words.map(w => ({
      ...w,
      reviewedAt: w.reviewedAt?.toISOString() ?? null,
    })),
    stats: {
      totalDue,
      totalWords,
      reviewedToday,
    },
  });
}

export const GET = withErrorHandling(handleGet);
