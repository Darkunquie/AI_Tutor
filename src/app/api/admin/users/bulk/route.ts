import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { Prisma } from '@/generated/prisma';
import { ApiError } from '@/lib/errors/ApiError';
import { withAdmin, validateBody, successResponse } from '@/lib/error-handler';
import { logger } from '@/lib/utils';
import { TRIAL_DAYS, type TrialDays } from '@/lib/config';

const BulkActionSchema = z.object({
  action: z.enum(['APPROVE_ALL', 'REJECT_ALL']),
  trial: z.object({
    enabled: z.boolean(),
    days: z.number().refine((d) => TRIAL_DAYS.includes(d as TrialDays), {
      message: 'Trial days must be 3, 6, or 14',
    }),
  }).optional(),
});

async function handlePost(request: NextRequest) {
  const body = await validateBody(request, BulkActionSchema);

  const pendingUsers = await db.user.findMany({
    where: { status: 'PENDING', role: 'USER' },
    select: { id: true },
  });

  if (pendingUsers.length === 0) {
    throw ApiError.badRequest('No pending users to process');
  }

  const ids = pendingUsers.map((u) => u.id);

  if (body.action === 'APPROVE_ALL') {
    const trialEnabled = body.trial?.enabled ?? true;
    const trialDays = body.trial?.days ?? 3;

    const data: Prisma.UserUpdateManyMutationInput = { status: 'APPROVED' };
    if (trialEnabled) {
      data.subscriptionStatus = 'TRIAL';
      data.trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
    } else {
      data.subscriptionStatus = 'NONE';
      data.trialEndsAt = null;
    }

    const result = await db.user.updateMany({
      where: { id: { in: ids }, status: 'PENDING' },
      data,
    });

    const adminId = request.headers.get('x-user-id');
    logger.info('admin_action', { action: 'bulk_approve', adminId, processed: result.count, trial: body.trial });

    return successResponse({
      processed: result.count,
      total: pendingUsers.length,
      action: 'APPROVE_ALL',
    });
  }

  // REJECT_ALL
  const result = await db.user.updateMany({
    where: { id: { in: ids }, status: 'PENDING' },
    data: {
      status: 'REJECTED',
      subscriptionStatus: 'NONE',
      trialEndsAt: null,
    },
  });

  const adminId = request.headers.get('x-user-id');
  logger.info('admin_action', { action: 'bulk_reject', adminId, processed: result.count });

  return successResponse({
    processed: result.count,
    total: pendingUsers.length,
    action: 'REJECT_ALL',
  });
}

export const POST = withAdmin(handlePost);
