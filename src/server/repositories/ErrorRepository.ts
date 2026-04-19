import { db } from '@/server/infra/db';
import type { ErrorType } from '@/generated/prisma';

export const errorRepo = {
  async createMany(
    errors: Array<{
      sessionId: string;
      category: ErrorType;
      original: string;
      corrected: string;
      explanation: string;
    }>
  ) {
    if (errors.length === 0) { return; }
    return db.error.createMany({ data: errors });
  },

  async listBySession(sessionId: string) {
    return db.error.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  },
};
