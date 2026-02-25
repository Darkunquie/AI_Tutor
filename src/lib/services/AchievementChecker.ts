// Achievement checking and unlocking service

import { db } from '@/lib/db';
import { StreakCalculator } from './StreakCalculator';

export class AchievementChecker {
  /**
   * Check all achievements and unlock newly earned ones.
   * Returns array of newly unlocked achievement type strings.
   */
  static async checkAndUnlock(userId: string): Promise<string[]> {
    // Get already-unlocked
    const existing = await db.achievement.findMany({
      where: { userId },
      select: { type: true },
    });
    const unlockedSet = new Set(existing.map(a => a.type));

    // Gather data in parallel
    const [totalSessions, totalVocab, bestScore, distinctModes, streakData] = await Promise.all([
      db.session.count({ where: { userId, score: { not: null } } }),
      db.vocabulary.count({ where: { userId } }),
      db.session.findFirst({ where: { userId }, orderBy: { score: 'desc' }, select: { score: true } }),
      db.session.findMany({ where: { userId }, select: { mode: true }, distinct: ['mode'] }),
      StreakCalculator.getStreakData(userId),
    ]);

    // Evaluate criteria
    const criteria: Record<string, boolean> = {
      FIRST_SESSION: totalSessions >= 1,
      SESSIONS_10: totalSessions >= 10,
      SESSIONS_50: totalSessions >= 50,
      VOCAB_10: totalVocab >= 10,
      VOCAB_50: totalVocab >= 50,
      VOCAB_100: totalVocab >= 100,
      FIRST_A: (bestScore?.score ?? 0) >= 90,
      ALL_MODES: distinctModes.length >= 5,
      STREAK_3: streakData.currentStreak >= 3,
      STREAK_7: streakData.currentStreak >= 7,
      STREAK_30: streakData.currentStreak >= 30,
    };

    const newlyUnlocked: string[] = [];
    for (const [type, met] of Object.entries(criteria)) {
      if (met && !unlockedSet.has(type)) {
        newlyUnlocked.push(type);
      }
    }

    // Insert new achievements individually (SQLite doesn't support skipDuplicates)
    if (newlyUnlocked.length > 0) {
      const results = await Promise.allSettled(
        newlyUnlocked.map(type =>
          db.achievement.create({ data: { userId, type } })
        )
      );
      
      // Log and filter failures
      const succeeded: string[] = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          succeeded.push(newlyUnlocked[index]);
        } else {
          // Only ignore duplicate key errors, log others
          const error = result.reason;
          if (error?.code !== 'P2002') {
            console.error(`Failed to create achievement ${newlyUnlocked[index]}:`, error);
          }
        }
      });
      
      return succeeded;
    }

    return newlyUnlocked;
  }
}
