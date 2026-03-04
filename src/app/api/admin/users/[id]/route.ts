import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { Prisma } from '@/generated/prisma';
import { ApiError } from '@/lib/errors/ApiError';
import { withAdmin, validateBody, successResponse } from '@/lib/error-handler';
import { logger } from '@/lib/utils';
import { TRIAL_DAYS, type TrialDays } from '@/lib/config';

const UpdateUserSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']).optional(),
  trial: z.object({
    enabled: z.boolean(),
    days: z.number().refine((d) => TRIAL_DAYS.includes(d as TrialDays), {
      message: 'Trial days must be 3, 6, or 14',
    }),
  }).optional(),
  extendTrial: z.object({
    days: z.number().refine((d) => TRIAL_DAYS.includes(d as TrialDays), {
      message: 'Trial days must be 3, 6, or 14',
    }),
  }).optional(),
}).refine((data) => data.status || data.extendTrial, {
  message: 'Must provide status update or trial extension',
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
      subscriptionStatus: true,
      trialEndsAt: true,
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
  const body = await validateBody(request, UpdateUserSchema);

  const user = await db.user.findUnique({ where: { id } });
  if (!user) throw ApiError.notFound('User');

  if (user.role === 'ADMIN') {
    throw ApiError.forbidden('Cannot change admin status');
  }

  // Prevent admin from modifying their own account
  const requestingUserId = request.headers.get('x-user-id');
  if (requestingUserId === id) {
    throw ApiError.forbidden('Cannot modify your own account');
  }

  // Handle extend trial (no status change)
  if (body.extendTrial && !body.status) {
    if (user.status !== 'APPROVED') {
      throw ApiError.badRequest('Can only extend trial for approved users');
    }

    const now = new Date();
    const msToAdd = body.extendTrial.days * 24 * 60 * 60 * 1000;
    let newTrialEnd: Date;

    // If active trial, add days to existing end date
    if (user.subscriptionStatus === 'TRIAL' && user.trialEndsAt && new Date(user.trialEndsAt) > now) {
      newTrialEnd = new Date(new Date(user.trialEndsAt).getTime() + msToAdd);
    } else {
      // Expired or no trial — start fresh from now
      newTrialEnd = new Date(now.getTime() + msToAdd);
    }

    const updated = await db.user.update({
      where: { id },
      data: {
        subscriptionStatus: 'TRIAL',
        trialEndsAt: newTrialEnd,
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        subscriptionStatus: true,
        trialEndsAt: true,
      },
    });

    logger.info('admin_action', { action: 'extend_trial', adminId: requestingUserId, targetId: id, days: body.extendTrial.days, newTrialEnd: newTrialEnd.toISOString() });

    return successResponse(updated);
  }

  // Handle approve/reject with optional trial
  const data: Prisma.UserUpdateInput = { status: body.status };

  if (body.status === 'APPROVED') {
    if (body.trial?.enabled) {
      data.subscriptionStatus = 'TRIAL';
      data.trialEndsAt = new Date(Date.now() + body.trial.days * 24 * 60 * 60 * 1000);
    } else {
      data.subscriptionStatus = 'NONE';
      data.trialEndsAt = null;
    }
  } else if (body.status === 'REJECTED') {
    data.subscriptionStatus = 'NONE';
    data.trialEndsAt = null;
  }

  const updated = await db.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      subscriptionStatus: true,
      trialEndsAt: true,
    },
  });

  logger.info('admin_action', { action: body.status === 'APPROVED' ? 'approve_user' : 'reject_user', adminId: requestingUserId, targetId: id, trial: body.trial });

  return successResponse(updated);
}

export const GET = withAdmin(handleGet);
export const PATCH = withAdmin(handlePatch);
