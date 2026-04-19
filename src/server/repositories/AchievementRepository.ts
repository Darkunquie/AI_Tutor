import { db } from '@/server/infra/db';

export const achievementRepo = {
  async findByUser(userId: string) {
    return db.achievement.findMany({ where: { userId } });
  },

  async findTypesByUser(userId: string) {
    return db.achievement.findMany({
      where: { userId },
      select: { type: true },
    });
  },

  async create(data: { userId: string; type: string }) {
    return db.achievement.create({ data });
  },

  async exists(userId: string, type: string) {
    const count = await db.achievement.count({ where: { userId, type } });
    return count > 0;
  },
};
