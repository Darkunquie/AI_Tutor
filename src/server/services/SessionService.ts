// SessionService — orchestrates session-end logic.
//
// The key optimization: score calculation + session update run on the hot path
// (the caller responds immediately after), while daily stats, achievements,
// and streak updates run AFTER the HTTP response via setImmediate.

import { db } from '@/server/infra/db';
import { sessionRepo } from '@/server/repositories/SessionRepository';
import { dailyStatsRepo } from '@/server/repositories/DailyStatsRepository';
import { ScoreCalculator } from '@/lib/services/ScoreCalculator';
import { AchievementChecker } from '@/lib/services/AchievementChecker';
import { logger } from '@/server/infra/logger';
import { ApiError } from '@/lib/errors/ApiError';
import type { ErrorBreakdown } from '@/lib/types';

interface EndSessionInput {
  duration?: number;
  score?: number;
  fillerWordCount?: number;
  avgPronunciation?: number;
}

export const sessionService = {
  /**
   * End a session: calculate server-side score, persist, then kick off
   * post-session work (stats, achievements, streak) asynchronously.
   *
   * Returns the updated session immediately so the route can respond fast.
   */
  async endSession(sessionId: string, userId: string, input: EndSessionInput) {
    // 1. Verify ownership
    const session = await sessionRepo.findForUser(sessionId, userId);
    if (!session) {
      throw ApiError.notFound('Session');
    }

    // 2. Build update payload
    const updateData: Record<string, unknown> = {};

    if (input.duration !== undefined) {
      updateData.duration = input.duration;
    }
    if (input.fillerWordCount !== undefined) {
      updateData.fillerWordCount = input.fillerWordCount;
    }
    if (input.avgPronunciation !== undefined) {
      updateData.avgPronunciation = input.avgPronunciation;
    }

    // 3. If session is ending (score provided), recalculate server-side
    let errorBreakdown: ErrorBreakdown | null = null;

    if (input.score !== undefined) {
      const [userMessageCount, errorCounts, pronunciationMessages, currentSession] =
        await Promise.all([
          db.message.count({ where: { sessionId, role: 'USER' } }),
          db.error.groupBy({
            by: ['category'],
            where: { sessionId },
            _count: true,
          }),
          db.message.findMany({
            where: {
              sessionId,
              role: 'USER',
              pronunciationScore: { not: null },
            },
            select: { pronunciationScore: true },
          }),
          db.session.findFirst({
            where: { id: sessionId, userId },
            select: { fillerWordCount: true },
          }),
        ]);

      errorBreakdown = {
        GRAMMAR:
          errorCounts.find((e) => e.category === 'GRAMMAR')?._count || 0,
        VOCABULARY:
          errorCounts.find((e) => e.category === 'VOCABULARY')?._count || 0,
        STRUCTURE:
          errorCounts.find((e) => e.category === 'STRUCTURE')?._count || 0,
        FLUENCY:
          errorCounts.find((e) => e.category === 'FLUENCY')?._count || 0,
      };

      const calculatedAvgPronunciation =
        pronunciationMessages.length > 0
          ? pronunciationMessages.reduce(
              (sum, m) => sum + (m.pronunciationScore || 0),
              0,
            ) / pronunciationMessages.length
          : null;

      const dbFillerCount = Math.max(
        currentSession?.fillerWordCount || 0,
        input.fillerWordCount || 0,
      );

      const calculatedScore = ScoreCalculator.calculateSessionScore({
        errorCounts: errorBreakdown,
        messageCount: Math.max(userMessageCount, 1),
        fillerWordCount: dbFillerCount,
        avgPronunciation: calculatedAvgPronunciation,
      });

      updateData.score = calculatedScore;
      if (calculatedAvgPronunciation !== null) {
        updateData.avgPronunciation = Math.round(calculatedAvgPronunciation);
      }
    }

    // 4. HOT PATH: update session (respond after this)
    const updatedSession = await db.session.update({
      where: { id: sessionId, userId },
      data: updateData,
    });

    // 5. Async post-session work — runs AFTER response via setImmediate
    if (input.score !== undefined) {
      setImmediate(() => {
        this.runPostSessionWork(
          sessionId,
          userId,
          updatedSession,
          errorBreakdown,
        ).catch((err) => {
          logger.error('Post-session async work failed', err);
        });
      });
    }

    return updatedSession;
  },

  /**
   * Post-session work: daily stats upsert, achievement check, streak update.
   * Runs asynchronously after the HTTP response has been sent.
   */
  async runPostSessionWork(
    sessionId: string,
    userId: string,
    session: { duration: number; score: number | null; fillerWordCount: number },
    errorBreakdown: ErrorBreakdown | null,
  ) {
    // 1. Update daily stats
    await sessionService.updateDailyStats(sessionId, userId, session, errorBreakdown);

    // 2. Check achievements
    await sessionService.checkAchievements(userId);

    // 3. Update streak (StreakCalculator reads from dailyStats, so it
    //    automatically reflects the newly upserted stats above)
    //    Note: streak is computed on-read, no separate write needed.
    logger.debug('Post-session work completed', { sessionId });
  },

  /**
   * Update daily stats with proper averaging logic.
   * Preserves the exact averaging behavior from the original route handler.
   */
  async updateDailyStats(
    sessionId: string,
    userId: string,
    session: { duration: number; score: number | null; fillerWordCount: number },
    errorBreakdown: ErrorBreakdown | null,
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If we don't have pre-computed error breakdown, fetch it
    let errors = errorBreakdown;
    if (!errors) {
      const errorCounts = await db.error.groupBy({
        by: ['category'],
        where: { sessionId },
        _count: true,
      });
      errors = {
        GRAMMAR:
          errorCounts.find((e) => e.category === 'GRAMMAR')?._count || 0,
        VOCABULARY:
          errorCounts.find((e) => e.category === 'VOCABULARY')?._count || 0,
        STRUCTURE:
          errorCounts.find((e) => e.category === 'STRUCTURE')?._count || 0,
        FLUENCY:
          errorCounts.find((e) => e.category === 'FLUENCY')?._count || 0,
      };
    }

    // Get current daily stats to calculate proper average
    const currentStats = await dailyStatsRepo.findByUserAndDate(
      userId,
      today,
    );

    const newAvgScore = session.score === null
      ? (currentStats?.avgScore ?? 0)
      : ScoreCalculator.calculateNewAverageScore({
          currentStats: currentStats || { sessionsCount: 0, avgScore: 0 },
          newSessionScore: session.score,
        });

    // Count new vocabulary words learned in this session
    const wordsLearnedCount = await db.vocabulary.count({
      where: { sessionId },
    });

    await dailyStatsRepo.upsert(userId, today, {
      sessionsCount: 1,
      totalDuration: session.duration,
      avgScore: newAvgScore,
      grammarErrors: errors.GRAMMAR,
      vocabErrors: errors.VOCABULARY,
      structureErrors: errors.STRUCTURE,
      fluencyErrors: errors.FLUENCY,
      wordsLearned: wordsLearnedCount,
      fillerWords: session.fillerWordCount,
    });
  },

  /**
   * Check and unlock achievements for user.
   */
  async checkAchievements(userId: string) {
    const newlyUnlocked = await AchievementChecker.checkAndUnlock(userId);
    if (newlyUnlocked.length > 0) {
      logger.info('Achievements unlocked', { achievements: newlyUnlocked });
    }
  },
};
