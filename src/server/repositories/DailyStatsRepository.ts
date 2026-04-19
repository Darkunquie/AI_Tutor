import { db } from '@/server/infra/db';

function toMidnight(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const dailyStatsRepo = {
  async findByUserAndDate(userId: string, date: Date) {
    return db.dailyStats.findUnique({
      where: { userId_date: { userId, date: toMidnight(date) } },
      select: { sessionsCount: true, avgScore: true },
    });
  },

  async upsert(
    userId: string,
    date: Date,
    data: {
      sessionsCount: number;
      totalDuration: number;
      avgScore: number;
      grammarErrors: number;
      vocabErrors: number;
      structureErrors: number;
      fluencyErrors: number;
      wordsLearned: number;
      fillerWords: number;
    },
  ) {
    const dateKey = toMidnight(date);

    return db.dailyStats.upsert({
      where: { userId_date: { userId, date: dateKey } },
      create: {
        userId,
        date: dateKey,
        sessionsCount: data.sessionsCount,
        totalDuration: data.totalDuration,
        avgScore: data.avgScore,
        grammarErrors: data.grammarErrors,
        vocabErrors: data.vocabErrors,
        structureErrors: data.structureErrors,
        fluencyErrors: data.fluencyErrors,
        wordsLearned: data.wordsLearned,
        fillerWords: data.fillerWords,
      },
      update: {
        sessionsCount: { increment: data.sessionsCount },
        totalDuration: { increment: data.totalDuration },
        avgScore: data.avgScore,
        grammarErrors: { increment: data.grammarErrors },
        vocabErrors: { increment: data.vocabErrors },
        structureErrors: { increment: data.structureErrors },
        fluencyErrors: { increment: data.fluencyErrors },
        wordsLearned: { increment: data.wordsLearned },
        fillerWords: { increment: data.fillerWords },
      },
    });
  },

  async findByUserAndDateRange(userId: string, startDate: Date, endDate: Date) {
    return db.dailyStats.findMany({
      where: { userId, date: { gte: toMidnight(startDate), lte: toMidnight(endDate) } },
      orderBy: { date: 'asc' },
    });
  },
};
