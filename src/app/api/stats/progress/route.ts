import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ApiError } from '@/lib/errors/ApiError';
import { ProgressQuerySchema } from '@/lib/schemas/stats.schema';
import {
  withAuth,
  validateQuery,
  successResponse,
} from '@/lib/error-handler';

// GET /api/stats/progress - Get time-series progress data
async function handleGet(request: NextRequest) {
  const query = validateQuery(request, ProgressQuerySchema);
  const { period = '30d' } = query;

  // Get authenticated user ID from middleware headers
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    throw ApiError.unauthorized('User ID not found');
  }

  // Calculate date range
  const now = new Date();
  let startDate: Date;
  let days: number;

  if (period === 'all') {
    // Find earliest session to determine actual start date
    const earliest = await db.session.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });
    startDate = earliest
      ? new Date(earliest.createdAt)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
    days = Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  } else {
    days = parseInt(period) || 30;
    startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  // Get daily stats
  const dailyStats = await db.dailyStats.findMany({
    where: {
      userId,
      date: { gte: startDate },
    },
    orderBy: { date: 'asc' },
  });

  // If we have daily stats, use them
  if (dailyStats.length > 0) {
    return successResponse({
      data: dailyStats.map((d) => ({
        date: d.date.toISOString().split('T')[0],
        sessions: d.sessionsCount,
        duration: d.totalDuration,
        score: Math.round(d.avgScore),
        grammarErrors: d.grammarErrors,
        vocabErrors: d.vocabErrors,
        structureErrors: d.structureErrors,
        fluencyErrors: d.fluencyErrors,
        fillerWords: d.fillerWords,
        wordsLearned: d.wordsLearned,
      })),
      period,
    });
  }

  // Otherwise, aggregate from sessions
  const sessions = await db.session.findMany({
    where: {
      userId,
      createdAt: { gte: startDate },
    },
    orderBy: { createdAt: 'asc' },
    include: {
      errors: {
        select: { category: true },
      },
    },
  });

  // Group sessions by date
  const byDate = new Map<
    string,
    {
      sessions: number;
      duration: number;
      scores: number[];
      grammarErrors: number;
      vocabErrors: number;
      structureErrors: number;
      fluencyErrors: number;
      fillerWords: number;
    }
  >();

  for (const session of sessions) {
    const dateKey = session.createdAt.toISOString().split('T')[0];
    const existing = byDate.get(dateKey) || {
      sessions: 0,
      duration: 0,
      scores: [],
      grammarErrors: 0,
      vocabErrors: 0,
      structureErrors: 0,
      fluencyErrors: 0,
      fillerWords: 0,
    };

    existing.sessions++;
    existing.duration += session.duration;
    if (session.score !== null) {
      existing.scores.push(session.score);
    }
    existing.fillerWords += session.fillerWordCount;

    for (const error of session.errors) {
      switch (error.category) {
        case 'GRAMMAR':
          existing.grammarErrors++;
          break;
        case 'VOCABULARY':
          existing.vocabErrors++;
          break;
        case 'STRUCTURE':
          existing.structureErrors++;
          break;
        case 'FLUENCY':
          existing.fluencyErrors++;
          break;
      }
    }

    byDate.set(dateKey, existing);
  }

  // Convert to array and fill in missing dates
  const data: Array<{
    date: string;
    sessions: number;
    duration: number;
    score: number;
    grammarErrors: number;
    vocabErrors: number;
    structureErrors: number;
    fluencyErrors: number;
    fillerWords: number;
  }> = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateKey = date.toISOString().split('T')[0];
    const dayData = byDate.get(dateKey);

    if (dayData) {
      data.push({
        date: dateKey,
        sessions: dayData.sessions,
        duration: dayData.duration,
        score:
          dayData.scores.length > 0
            ? Math.round(dayData.scores.reduce((a, b) => a + b, 0) / dayData.scores.length)
            : 0,
        grammarErrors: dayData.grammarErrors,
        vocabErrors: dayData.vocabErrors,
        structureErrors: dayData.structureErrors,
        fluencyErrors: dayData.fluencyErrors,
        fillerWords: dayData.fillerWords,
      });
    } else {
      // Include zero data for days without sessions
      data.push({
        date: dateKey,
        sessions: 0,
        duration: 0,
        score: 0,
        grammarErrors: 0,
        vocabErrors: 0,
        structureErrors: 0,
        fluencyErrors: 0,
        fillerWords: 0,
      });
    }
  }

  return successResponse({ data, period });
}

export const GET = withAuth(handleGet);
