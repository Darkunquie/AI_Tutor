import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { ApiError } from '@/lib/errors/ApiError';
import { withAdmin, validateBody, successResponse } from '@/lib/error-handler';

const TRIAL_DAYS = [3, 6, 14] as const;

const BulkActionSchema = z.object({
  action: z.enum(['APPROVE_ALL', 'REJECT_ALL']),
  trial: z.object({
    enabled: z.boolean(),
    days: z.number().refine((d) => TRIAL_DAYS.includes(d as 3 | 6 | 14), {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { status: 'APPROVED' };
    if (trialEnabled) {
      data.subscriptionStatus = 'TRIAL';
      data.trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
    } else {
      data.subscriptionStatus = 'NONE';
      data.trialEndsAt = null;
    }

    const result = await db.user.updateMany({
      where: { id: { in: ids } },
      data,
    });

    return successResponse({
      processed: result.count,
      total: pendingUsers.length,
      action: 'APPROVE_ALL',
    });
  }

  // REJECT_ALL
  const result = await db.user.updateMany({
    where: { id: { in: ids } },
    data: {
      status: 'REJECTED',
      subscriptionStatus: 'NONE',
      trialEndsAt: null,
    },
  });

  return successResponse({
    processed: result.count,
    total: pendingUsers.length,
    action: 'REJECT_ALL',
  });
}

export const POST = withAdmin(handlePost);
