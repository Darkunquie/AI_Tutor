// Streak calculation service using DailyStats data

import { db } from '@/lib/db';
import type { StreakData } from '@/lib/types';

function formatDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dayBefore(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() - 1);
  return formatDateStr(d);
}

export class StreakCalculator {
  static async getStreakData(userId: string): Promise<StreakData> {
    // Get user's daily goal
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { dailyGoalMinutes: true },
    });
    const dailyGoalMinutes = user?.dailyGoalMinutes ?? 15;

    // Get all active days sorted descending
    const days = await db.dailyStats.findMany({
      where: { userId, sessionsCount: { gte: 1 } },
      select: { date: true },
      orderBy: { date: 'desc' },
    });

    // Get today's stats for goal progress (UTC normalized)
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const todayStats = await db.dailyStats.findFirst({
      where: {
        userId,
        date: today,
      },
      select: { totalDuration: true },
    });
    const todayMinutes = Math.floor((todayStats?.totalDuration ?? 0) / 60);

    if (days.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        todayMinutes,
        dailyGoalMinutes,
        dailyGoalMet: todayMinutes >= dailyGoalMinutes,
      };
    }

    // Convert to date strings for comparison (UTC normalized)
    const dateStrings = days.map(d => {
      const date = new Date(d.date);
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    });

    const nowUtc = new Date();
    const todayStr = `${nowUtc.getUTCFullYear()}-${String(nowUtc.getUTCMonth() + 1).padStart(2, '0')}-${String(nowUtc.getUTCDate()).padStart(2, '0')}`;
    const yesterdayUtc = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate() - 1));
    const yesterdayStr = `${yesterdayUtc.getUTCFullYear()}-${String(yesterdayUtc.getUTCMonth() + 1).padStart(2, '0')}-${String(yesterdayUtc.getUTCDate()).padStart(2, '0')}`;

    // Current streak: must include today or yesterday
    let currentStreak = 0;
    if (dateStrings[0] === todayStr || dateStrings[0] === yesterdayStr) {
      currentStreak = 1;
      for (let i = 1; i < dateStrings.length; i++) {
        if (dateStrings[i] === dayBefore(dateStrings[i - 1])) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Longest streak
    let longestStreak = 1;
    let streak = 1;
    for (let i = 1; i < dateStrings.length; i++) {
      if (dateStrings[i] === dayBefore(dateStrings[i - 1])) {
        streak++;
        longestStreak = Math.max(longestStreak, streak);
      } else {
        streak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, currentStreak);

    return {
      currentStreak,
      longestStreak,
      todayMinutes,
      dailyGoalMinutes,
      dailyGoalMet: todayMinutes >= dailyGoalMinutes,
    };
  }
}
