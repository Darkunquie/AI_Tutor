import { db } from '@/server/infra/db';
import type { Role } from '@/generated/prisma';

export const messageRepo = {
  async createUserMessage(data: { sessionId: string; content: string }) {
    return db.message.create({
      data: { sessionId: data.sessionId, content: data.content, role: 'USER' as Role, timestamp: new Date() },
    });
  },

  async createAiMessage(data: { sessionId: string; content: string }) {
    return db.message.create({
      data: { sessionId: data.sessionId, content: data.content, role: 'AI' as Role, timestamp: new Date() },
    });
  },

  async listBySession(sessionId: string) {
    return db.message.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });
  },

  async countBySession(sessionId: string, role?: Role) {
    return db.message.count({
      where: { sessionId, ...(role ? { role } : {}) },
    });
  },
};
