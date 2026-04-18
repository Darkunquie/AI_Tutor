import { db } from '@/server/infra/db';
import type { UserStatus } from '@/generated/prisma';

export const userRepo = {
  async findAuthBundle(id: string) {
    return db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });
  },

  async findByEmail(email: string) {
    return db.user.findUnique({ where: { email } });
  },

  async findByPhone(phone: string) {
    return db.user.findFirst({ where: { phone } });
  },

  async create(data: { name: string; email: string; phone: string; password: string }) {
    return db.user.create({
      data: {
        ...data,
        status: 'PENDING',
        role: 'USER',
        level: 'BEGINNER',
      },
    });
  },

  async updateStatus(id: string, status: UserStatus) {
    return db.user.update({ where: { id }, data: { status } });
  },
};
