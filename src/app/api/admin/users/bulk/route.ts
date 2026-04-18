import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { ApiError } from '@/lib/errors/ApiError';
import { withAdmin, validateBody, successResponse } from '@/lib/error-handler';
import { logger } from '@/lib/utils';

const BulkActionSchema = z.object({
  action: z.enum(['APPROVE_ALL', 'REJECT_ALL']),
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
    const result = await db.user.updateMany({
      where: { id: { in: ids }, status: 'PENDING' },
      data: { status: 'APPROVED' },
    });

    const adminId = request.headers.get('x-user-id');
    logger.info('admin_action', { action: 'bulk_approve', adminId, processed: result.count });

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

  const adminId = request.headers.get('x-user-id');
  logger.info('admin_action', { action: 'bulk_reject', adminId, processed: result.count });

  return successResponse({
    processed: result.count,
    total: pendingUsers.length,
    action: 'REJECT_ALL',
  });
}

export const POST = withAdmin(handlePost);
