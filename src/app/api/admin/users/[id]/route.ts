import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/server/infra/db';
import { ApiError } from '@/lib/errors/ApiError';
import { withErrorHandling, validateBody, successResponse } from '@/lib/error-handler';
import { logger } from '@/server/infra/logger';
import { requireAdmin } from '@/server/http/auth-context';
import { checkRateLimit } from '@/lib/rate-limiter';

const UpdateUserSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

async function handleGet(
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) {
  const ctx = await requireAdmin(request);

  // Rate limit admin actions (60 requests/minute per admin)
  const adminRateLimit = await checkRateLimit(`admin:${ctx.userId}`, { maxAttempts: 60, windowMs: 60 * 1000 });
  if (!adminRateLimit.allowed) {
    throw ApiError.rateLimited('Too many admin requests. Please slow down.');
  }

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
  const ctx = await requireAdmin(request);

  // Rate limit admin actions (60 requests/minute per admin)
  const adminRateLimit = await checkRateLimit(`admin:${ctx.userId}`, { maxAttempts: 60, windowMs: 60 * 1000 });
  if (!adminRateLimit.allowed) {
    throw ApiError.rateLimited('Too many admin requests. Please slow down.');
  }

  const { id } = await context!.params;
  const body = await validateBody(request, UpdateUserSchema);

  const user = await db.user.findUnique({ where: { id } });
  if (!user) throw ApiError.notFound('User');

  if (user.role === 'ADMIN') {
    throw ApiError.forbidden('Cannot change admin status');
  }

  // Prevent admin from modifying their own account
  if (ctx.userId === id) {
    throw ApiError.forbidden('Cannot modify your own account');
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

  logger.info('admin_action', { action: body.status === 'APPROVED' ? 'approve_user' : 'reject_user', adminId: ctx.userId, targetId: id });

  return successResponse(updated);
}

export const GET = withErrorHandling(handleGet);
export const PATCH = withErrorHandling(handlePatch);
