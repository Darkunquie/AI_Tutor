import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/server/infra/db';
import { ApiError } from '@/lib/errors/ApiError';
import { withErrorHandling, validateBody, successResponse } from '@/lib/error-handler';
import { logger } from '@/server/infra/logger';
import { requireAdmin } from '@/server/http/auth-context';
import { checkRateLimit } from '@/lib/rate-limiter';

const BulkActionSchema = z.object({
  action: z.enum(['APPROVE_ALL', 'REJECT_ALL']),
});

async function handlePost(request: NextRequest) {
  const ctx = await requireAdmin(request);

  // Rate limit admin actions (60 requests/minute per admin)
  const adminRateLimit = await checkRateLimit(`admin:${ctx.userId}`, { maxAttempts: 60, windowMs: 60 * 1000 });
  if (!adminRateLimit.allowed) {
    throw ApiError.rateLimited('Too many admin requests. Please slow down.');
  }

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
    const result = await db.user.updateMany({
      where: { id: { in: ids }, status: 'PENDING' },
      data: { status: 'APPROVED' },
    });

    logger.info('admin_action', { action: 'bulk_approve', adminId: ctx.userId, processed: result.count });

    return successResponse({
      processed: result.count,
      total: pendingUsers.length,
      action: 'APPROVE_ALL',
    });
  }

  // REJECT_ALL
  const result = await db.user.updateMany({
    where: { id: { in: ids }, status: 'PENDING' },
    data: { status: 'REJECTED' },
  });

  logger.info('admin_action', { action: 'bulk_reject', adminId: ctx.userId, processed: result.count });

  return successResponse({
    processed: result.count,
    total: pendingUsers.length,
    action: 'REJECT_ALL',
  });
}

export const POST = withErrorHandling(handlePost);
