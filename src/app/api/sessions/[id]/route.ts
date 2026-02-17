import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { UpdateSessionSchema } from '@/lib/schemas/session.schema';
import { ApiError } from '@/lib/errors/ApiError';
import { ValidationError } from '@/lib/errors/ValidationError';
import {
  withAuth,
  validateBody,
  successResponse,
} from '@/lib/error-handler';
import { ScoreCalculator } from '@/lib/services/ScoreCalculator';
import type { FillerWordDetection } from '@/lib/types';
import { safeJsonParse } from '@/lib/utils';

// GET /api/sessions/[id] - Get a specific session
async function handleGet(request: NextRequest, context?: { params: Promise<Record<string, string>> }) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    throw ApiError.unauthorized('User ID not found');
  }

  const params = context!.params;
  const { id } = await params;

  // SECURITY: Only fetch session if it belongs to authenticated user
  const session = await db.session.findFirst({
    where: {
      id,
      userId, // Verify ownership
    },
    include: {
      messages: {
        orderBy: { timestamp: 'asc' },
      },
      errors: true,
      vocabulary: true,
    },
  });

  if (!session) {
    throw ApiError.notFound('Session');
  }

  // Parse JSON fields safely (with logging enabled to catch data corruption)
  const fillerDetails = safeJsonParse<FillerWordDetection[]>(session.fillerDetails, [], true);
  const vocabularyJson = safeJsonParse<string[]>(session.vocabularyJson, [], true);

  return successResponse({
    id: session.id,
    mode: session.mode,
    level: session.level,
    duration: session.duration,
    score: session.score,
    fillerWordCount: session.fillerWordCount,
    fillerDetails,
    avgPronunciation: session.avgPronunciation,
    vocabularyJson,
    vocabulary: session.vocabulary,
    messages: session.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      corrections: safeJsonParse(m.corrections, null),
      pronunciationScore: m.pronunciationScore,
      fillerWordCount: m.fillerWordCount,
      timestamp: m.timestamp,
    })),
    errors: session.errors,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  });
}

// PATCH /api/sessions/[id] - Update a session
async function handlePatch(request: NextRequest, context?: { params: Promise<Record<string, string>> }) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    throw ApiError.unauthorized('User ID not found');
  }

  const { id } = await context!.params;
  const body = await validateBody(request, UpdateSessionSchema);

  const {
    duration,
    score,
    fillerWordCount,
    fillerDetails,
    avgPronunciation,
    vocabularyJson,
  } = body;

  // Build update data
  const updateData: Record<string, unknown> = {};

  if (duration !== undefined) updateData.duration = duration;
  if (score !== undefined) updateData.score = score;
  if (fillerWordCount !== undefined) updateData.fillerWordCount = fillerWordCount;

  // Safely stringify JSON fields with error handling
  try {
    if (fillerDetails !== undefined) {
      updateData.fillerDetails = JSON.stringify(fillerDetails);
    }
    if (vocabularyJson !== undefined) {
      updateData.vocabularyJson = JSON.stringify(vocabularyJson);
    }
  } catch (error) {
    throw new ValidationError('Invalid data format for session update');
  }

  if (avgPronunciation !== undefined) updateData.avgPronunciation = avgPronunciation;

  // SECURITY: Verify session belongs to authenticated user
  const session = await db.session.update({
    where: {
      id,
      userId, // Only allow updating user's own sessions
    },
    data: updateData,
  });

  // Update daily stats if session is ending (has score)
  if (score !== undefined) {
    await updateDailyStats(session.userId, session.id, session);
  }

  return successResponse({
    id: session.id,
    duration: session.duration,
    score: session.score,
    fillerWordCount: session.fillerWordCount,
    avgPronunciation: session.avgPronunciation,
    updatedAt: session.updatedAt,
  });
}

// Helper function to update daily stats with proper averaging
async function updateDailyStats(
  userId: string,
  sessionId: string,
  session: {
    duration: number;
    score: number | null;
    fillerWordCount: number;
  }
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get error counts for THIS session only (not all user sessions)
  const errorCounts = await db.error.groupBy({
    by: ['category'],
    where: { sessionId },
    _count: true,
  });

  const grammarErrors = errorCounts.find((e) => e.category === 'GRAMMAR')?._count || 0;
  const vocabErrors = errorCounts.find((e) => e.category === 'VOCABULARY')?._count || 0;
  const structureErrors = errorCounts.find((e) => e.category === 'STRUCTURE')?._count || 0;
  const fluencyErrors = errorCounts.find((e) => e.category === 'FLUENCY')?._count || 0;

  // Get current daily stats to calculate proper average
  const currentStats = await db.dailyStats.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    select: {
      sessionsCount: true,
      avgScore: true,
    },
  });

  // Calculate new average score properly
  const newAvgScore = ScoreCalculator.calculateNewAverageScore({
    currentStats: currentStats || { sessionsCount: 0, avgScore: 0 },
    newSessionScore: session.score || 0,
  });

  // Count new vocabulary words learned in this session
  const wordsLearnedCount = await db.vocabulary.count({
    where: {
      sessionId,
    },
  });

  // Upsert daily stats
  await db.dailyStats.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    create: {
      userId,
      date: today,
      sessionsCount: 1,
      totalDuration: session.duration,
      avgScore: session.score || 0,
      grammarErrors,
      vocabErrors,
      structureErrors,
      fluencyErrors,
      wordsLearned: wordsLearnedCount,
      fillerWords: session.fillerWordCount,
    },
    update: {
      sessionsCount: { increment: 1 },
      totalDuration: { increment: session.duration },
      avgScore: newAvgScore,
      grammarErrors: { increment: grammarErrors },
      vocabErrors: { increment: vocabErrors },
      structureErrors: { increment: structureErrors },
      fluencyErrors: { increment: fluencyErrors },
      wordsLearned: { increment: wordsLearnedCount },
      fillerWords: { increment: session.fillerWordCount },
    },
  });
}

export const GET = withAuth(handleGet);
export const PATCH = withAuth(handlePatch);
