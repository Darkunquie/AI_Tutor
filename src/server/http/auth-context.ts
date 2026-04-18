import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { ApiError } from '@/lib/errors/ApiError';
import { db } from '@/server/infra/db';
import { getRedis } from '@/server/infra/redis';
import { logger } from '@/server/infra/logger';

export interface AuthContext {
  userId: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  status: string;
}

const AUTH_CACHE_TTL = 60; // seconds

function assertApproved(ctx: AuthContext): void {
  if (ctx.role !== 'ADMIN' && ctx.status !== 'APPROVED') {
    throw ApiError.forbidden('Account not approved');
  }
}

async function getCachedAuth(userId: string): Promise<AuthContext | null> {
  const redis = getRedis();
  if (!redis) { return null; }
  try {
    return await redis.get<AuthContext>(`auth:${userId}`);
  } catch (err) {
    logger.warn('Redis auth cache miss/error:', err);
    return null;
  }
}

async function setCachedAuth(ctx: AuthContext): Promise<void> {
  const redis = getRedis();
  if (!redis) { return; }
  try {
    await redis.set(`auth:${ctx.userId}`, ctx, { ex: AUTH_CACHE_TTL });
  } catch (err) {
    logger.warn('Redis auth cache set error:', err);
  }
}

export async function requireAuth(req: NextRequest): Promise<AuthContext> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  const cached = await getCachedAuth(payload.userId);
  if (cached) {
    assertApproved(cached);
    return cached;
  }

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, role: true, status: true },
  });

  if (!user) {
    throw ApiError.unauthorized('User no longer exists');
  }

  const ctx: AuthContext = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as 'USER' | 'ADMIN',
    status: user.status,
  };

  assertApproved(ctx);
  await setCachedAuth(ctx);

  return ctx;
}

export async function requireAdmin(req: NextRequest): Promise<AuthContext> {
  const ctx = await requireAuth(req);
  if (ctx.role !== 'ADMIN') {
    throw ApiError.forbidden('Admin access required');
  }
  return ctx;
}

export async function invalidateAuthCache(userId: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    try {
      await redis.del(`auth:${userId}`);
    } catch (err) {
      logger.warn('Redis auth cache invalidation error:', err);
    }
  }
}
