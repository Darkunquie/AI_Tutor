import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { Prisma } from '@/generated/prisma';
import { withAdmin, paginatedResponse, validateQuery } from '@/lib/error-handler';

const AdminUsersQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

async function handleGet(request: NextRequest) {
  const { status, search, page, pageSize } = validateQuery(request, AdminUsersQuerySchema);

  const where: Prisma.UserWhereInput = { role: 'USER' };

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        level: true,
        createdAt: true,
        _count: { select: { sessions: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.user.count({ where }),
  ]);

  return paginatedResponse(users, total, page, pageSize);
}

export const GET = withAdmin(handleGet);
