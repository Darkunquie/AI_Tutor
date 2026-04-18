import { db } from '@/server/infra/db';
import type { Mode, Level } from '@/generated/prisma';

export const sessionRepo = {
  async findForUser(id: string, userId: string) {
    return db.session.findFirst({
      where: { id, userId },
    });
  },

  async create(data: { userId: string; mode: Mode; level: Level }) {
    return db.session.create({ data });
  },

  async listForUser(userId: string, page: number, pageSize: number) {
    if (page < 1 || pageSize < 1) {
      throw new Error('page and pageSize must be positive integers');
    }
    const [sessions, total] = await Promise.all([
      db.session.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.session.count({ where: { userId } }),
    ]);
    return { sessions, total };
  },

  async updateEnd(id: string, data: Record<string, unknown>) {
    return db.session.update({ where: { id }, data });
  },
};
