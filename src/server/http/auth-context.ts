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

  // Try Redis cache first
  const redis = getRedis();
  if (redis) {
    try {
      const cached = await redis.get<AuthContext>(`auth:${payload.userId}`);
      if (cached) {
        return cached;
      }
    } catch (err) {
      logger.warn('Redis auth cache miss/error:', err);
    }
  }

  // Fallback to DB
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, role: true, status: true },
  });

  if (!user) {
    throw ApiError.unauthorized('User no longer exists');
  }

  if (user.role !== 'ADMIN' && user.status !== 'APPROVED') {
    throw ApiError.forbidden('Account not approved');
  }

  const ctx: AuthContext = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as 'USER' | 'ADMIN',
    status: user.status,
  };

  // Cache in Redis
  if (redis) {
    try {
      await redis.set(`auth:${user.id}`, JSON.stringify(ctx), { ex: AUTH_CACHE_TTL });
    } catch (err) {
      logger.warn('Redis auth cache set error:', err);
    }
  }

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
