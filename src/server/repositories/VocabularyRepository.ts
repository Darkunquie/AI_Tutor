import { db } from '@/server/infra/db';

export const vocabularyRepo = {
  async countByUser(userId: string) {
    return db.vocabulary.count({ where: { userId } });
  },

  async countBySession(sessionId: string) {
    return db.vocabulary.count({ where: { sessionId } });
  },
};
