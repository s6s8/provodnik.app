import { redis } from "@/lib/upstash/redis";

type RateLimitResult = {
  success: boolean;
  remaining: number;
};

const RATE_LIMIT_KEY_PREFIX = "rate-limit";

function hasUpstashRedisEnv() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

function getRateLimitKey(identifier: string, limit: number, window: number) {
  return `${RATE_LIMIT_KEY_PREFIX}:${identifier}:${limit}:${window}`;
}

export async function rateLimit(
  identifier: string,
  limit: number,
  window: number,
): Promise<RateLimitResult> {
  if (!hasUpstashRedisEnv()) {
    return {
      success: true,
      remaining: limit,
    };
  }

  const now = Date.now();
  const windowMs = window * 1_000;
  const windowStart = now - windowMs;
  const key = getRateLimitKey(identifier, limit, window);

  try {
    if (!redis) {
      return {
        success: true,
        remaining: limit,
      };
    }

    await redis.zremrangebyscore(key, 0, windowStart);

    const requestCount = await redis.zcard(key);

    if (requestCount >= limit) {
      return {
        success: false,
        remaining: 0,
      };
    }

    await Promise.all([
      redis.zadd(key, {
        score: now,
        member: `${now}:${crypto.randomUUID()}`,
      }),
      redis.expire(key, window),
    ]);

    return {
      success: true,
      remaining: Math.max(0, limit - requestCount - 1),
    };
  } catch {
    return {
      success: true,
      remaining: limit,
    };
  }
}
