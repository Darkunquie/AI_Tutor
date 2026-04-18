// Consolidated Redis client (Upstash)
//
// Lazy-initialised: only creates a connection when first requested
// and only if REDIS_URL + REDIS_TOKEN are configured.
// Returns null when Redis is not available (callers must handle the fallback).

import { Redis } from '@upstash/redis';
import { config } from '@/server/config';

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (redis) { return redis; }
  if (config.REDIS_URL && config.REDIS_TOKEN) {
    redis = new Redis({ url: config.REDIS_URL, token: config.REDIS_TOKEN });
  }
  return redis;
}
