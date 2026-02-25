import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { ApiError } from '@/lib/errors/ApiError';
import { withAdmin, validateBody, successResponse } from '@/lib/error-handler';

const UpdateUserStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

async function handleGet(
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) {
  const { id } = await context!.params;

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      level: true,
      dailyGoalMinutes: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          sessions: true,
          vocabulary: true,
          achievements: true,
        },
      },
    },
  });

  if (!user) throw ApiError.notFound('User');

  const recentSessions = await db.session.findMany({
    where: { userId: id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      mode: true,
      level: true,
      duration: true,
      score: true,
      createdAt: true,
    },
  });

  const durAgg = await db.session.aggregate({
    where: { userId: id },
    _sum: { duration: true },
    _avg: { score: true },
  });

  return successResponse({
    ...user,
    totalDuration: durAgg._sum.duration || 0,
    averageScore: Math.round(durAgg._avg.score || 0),
    recentSessions,
  });
}

async function handlePatch(
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) {
  const { id } = await context!.params;
  const body = await validateBody(request, UpdateUserStatusSchema);

  const user = await db.user.findUnique({ where: { id } });
  if (!user) throw ApiError.notFound('User');

  if (user.role === 'ADMIN') {
    throw ApiError.forbidden('Cannot change admin status');
  }

  const updated = await db.user.update({
    where: { id },
    data: { status: body.status },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
    },
  });

  return successResponse(updated);
}

export const GET = withAdmin(handleGet);
export const PATCH = withAdmin(handlePatch);
