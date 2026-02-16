import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ApiError } from '@/lib/errors/ApiError';
import { StatsQuerySchema } from '@/lib/schemas/stats.schema';
import {
  withErrorHandling,
  validateQuery,
  successResponse,
} from '@/lib/error-handler';
import { ScoreCalculator } from '@/lib/services/ScoreCalculator';

// GET /api/stats - Get overview stats for a user
async function handleGet(request: NextRequest) {
  const query = validateQuery(request, StatsQuerySchema);
  const { period = '30d' } = query;

  // Get authenticated user ID from middleware headers
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    throw ApiError.unauthorized('User ID not found');
  }

  // Calculate date range
  const now = new Date();
  let startDate: Date | undefined;

  if (period !== 'all') {
    const days = parseInt(period) || 30;
    startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  // Build where clause for sessions
  const sessionWhere: { userId: string; createdAt?: { gte: Date } } = { userId };
  if (startDate) {
    sessionWhere.createdAt = { gte: startDate };
  }

  // Get session aggregates
  const sessions = await db.session.findMany({
    where: sessionWhere,
    select: {
      id: true,
      duration: true,
      score: true,
      fillerWordCount: true,
      avgPronunciation: true,
    },
  });

  const totalSessions = sessions.length;
  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
  const sessionsWithScore = sessions.filter((s) => s.score !== null);
  const averageScore =
    sessionsWithScore.length > 0
      ? Math.round(
          sessionsWithScore.reduce((sum, s) => sum + (s.score || 0), 0) /
            sessionsWithScore.length
        )
      : 0;
  const totalFillerWords = sessions.reduce((sum, s) => sum + s.fillerWordCount, 0);
  const sessionsWithPronunciation = sessions.filter((s) => s.avgPronunciation !== null);
  const avgPronunciation =
    sessionsWithPronunciation.length > 0
      ? Math.round(
          sessionsWithPronunciation.reduce((sum, s) => sum + (s.avgPronunciation || 0), 0) /
            sessionsWithPronunciation.length
        )
      : 0;

  // Get vocabulary count
  const wordsLearned = await db.vocabulary.count({
    where: { userId: userId },
  });

  // Get error breakdown - use session IDs to avoid N+1 query
  const sessionIds = sessions.map(s => s.id);
  const errors = await db.error.groupBy({
    by: ['category'],
    where: {
      sessionId: { in: sessionIds },
    },
    _count: true,
  });

  const errorBreakdown = {
    GRAMMAR: errors.find((e) => e.category === 'GRAMMAR')?._count || 0,
    VOCABULARY: errors.find((e) => e.category === 'VOCABULARY')?._count || 0,
    STRUCTURE: errors.find((e) => e.category === 'STRUCTURE')?._count || 0,
    FLUENCY: errors.find((e) => e.category === 'FLUENCY')?._count || 0,
  };

  // Calculate week-over-week change using ScoreCalculator
  const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const lastWeekEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const thisWeekSessions = await db.session.count({
    where: {
      userId: userId,
      createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
    },
  });

  const lastWeekSessions = await db.session.count({
    where: {
      userId: userId,
      createdAt: { gte: lastWeekStart, lt: lastWeekEnd },
    },
  });

  const weeklyChange = ScoreCalculator.calculateWeeklyChange(thisWeekSessions, lastWeekSessions);

  return successResponse({
    totalSessions,
    totalDuration,
    averageScore,
    wordsLearned,
    totalFillerWords,
    avgPronunciation,
    errorBreakdown,
    weeklyChange,
  });
}

export const GET = withErrorHandling(handleGet);
