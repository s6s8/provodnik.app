import { redis } from "@/lib/upstash/redis";

type RateLimitResult = {
  success: boolean;
  remaining: number;
};

const RATE_LIMIT_KEY_PREFIX = "rate-limit";
const FORGOT_PASSWORD_PREFIX = "forgot-password:";
const RATE_LIMIT_SCRIPT = `
redis.call("ZREMRANGEBYSCORE", KEYS[1], 0, ARGV[1])

local request_count = redis.call("ZCARD", KEYS[1])
local limit = tonumber(ARGV[3])
if request_count >= limit then
  redis.call("EXPIRE", KEYS[1], ARGV[4])
  return {0, 0}
end

redis.call("ZADD", KEYS[1], ARGV[2], ARGV[5])
redis.call("EXPIRE", KEYS[1], ARGV[4])
return {1, limit - request_count - 1}
`;

function hasUpstashRedisEnv() {
  return Boolean(
    process.env.STORAGE_KV_REST_API_URL && process.env.STORAGE_KV_REST_API_TOKEN,
  );
}

function normalizeRateLimitIdentifier(identifier: string) {
  const trimmed = identifier.trim();
  if (trimmed.toLowerCase().startsWith(FORGOT_PASSWORD_PREFIX)) {
    return `${FORGOT_PASSWORD_PREFIX}${trimmed
      .slice(FORGOT_PASSWORD_PREFIX.length)
      .trim()
      .toLowerCase()}`;
  }

  return trimmed;
}

function getRateLimitKey(identifier: string, limit: number, window: number) {
  return `${RATE_LIMIT_KEY_PREFIX}:${normalizeRateLimitIdentifier(identifier)}:${limit}:${window}`;
}

function parseRateLimitScriptResult(result: unknown): RateLimitResult {
  if (!Array.isArray(result) || result.length < 2) {
    throw new Error("Unexpected rate limit script result");
  }

  const allowed = Number(result[0]);
  const remaining = Number(result[1]);
  if (!Number.isFinite(allowed) || !Number.isFinite(remaining)) {
    throw new Error("Unexpected rate limit script result");
  }

  return {
    success: allowed === 1,
    remaining: Math.max(0, remaining),
  };
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

    const result = await redis.eval(RATE_LIMIT_SCRIPT, [key], [
      windowStart,
      now,
      limit,
      window,
      `${now}:${crypto.randomUUID()}`,
    ]);

    return parseRateLimitScriptResult(result);
  } catch {
    return {
      success: true,
      remaining: limit,
    };
  }
}
