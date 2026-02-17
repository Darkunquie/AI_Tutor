import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, successResponse } from '@/lib/error-handler';

// Interval in days based on mastery level
function intervalDays(mastery: number): number {
  if (mastery <= 20) return 1;
  if (mastery <= 40) return 3;
  if (mastery <= 60) return 7;
  if (mastery <= 80) return 14;
  return 30;
}

export const GET = withAuth(async (request: NextRequest) => {
  const userId = request.headers.get('x-user-id')!;
  const limit = Math.min(
    50,
    Math.max(1, Number(request.nextUrl.searchParams.get('limit')) || 20)
  );

  // Fetch all vocabulary for the user
  const allVocab = await db.vocabulary.findMany({
    where: { userId },
    select: {
      id: true,
      word: true,
      definition: true,
      context: true,
      mastery: true,
      reviewedAt: true,
    },
    orderBy: [{ mastery: 'asc' }, { reviewedAt: 'asc' }],
  });

  const now = new Date();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Filter due words
  const dueWords = allVocab.filter(word => {
    if (!word.reviewedAt) return true;
    const daysSinceReview = (now.getTime() - word.reviewedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceReview >= intervalDays(word.mastery);
  });

  // Count reviewed today
  const reviewedToday = allVocab.filter(
    word => word.reviewedAt && word.reviewedAt >= todayStart
  ).length;

  const words = dueWords.slice(0, limit).map(w => ({
    ...w,
    reviewedAt: w.reviewedAt?.toISOString() ?? null,
  }));

  return successResponse({
    words,
    stats: {
      totalDue: dueWords.length,
      totalWords: allVocab.length,
      reviewedToday,
    },
  });
});
