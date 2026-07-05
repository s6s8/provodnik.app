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

// In-memory fallback so a missing/broken Redis can't degrade to "no limit at
// all" (PRD-024). ponytail: per-instance sliding window — on serverless each
// cold instance keeps its own map, so this is a floor, not a global cap. Redis
// stays the authoritative limiter; the map only guards abuse when Redis is down.
const memoryHits = new Map<string, number[]>();

function memoryRateLimit(identifier: string, limit: number, window: number): RateLimitResult {
  if (memoryHits.size > 10_000) memoryHits.clear(); // crude bound; fallback path only
  const now = Date.now();
  const windowStart = now - window * 1_000;
  const key = getRateLimitKey(identifier, limit, window);
  const hits = (memoryHits.get(key) ?? []).filter((t) => t > windowStart);
  if (hits.length >= limit) {
    memoryHits.set(key, hits);
    return { success: false, remaining: 0 };
  }
  hits.push(now);
  memoryHits.set(key, hits);
  return { success: true, remaining: Math.max(0, limit - hits.length) };
}

export async function rateLimit(
  identifier: string,
  limit: number,
  window: number,
): Promise<RateLimitResult> {
  if (!hasUpstashRedisEnv() || !redis) {
    return memoryRateLimit(identifier, limit, window);
  }

  const now = Date.now();
  const windowMs = window * 1_000;
  const windowStart = now - windowMs;
  const key = getRateLimitKey(identifier, limit, window);

  try {
    const result = await redis.eval(RATE_LIMIT_SCRIPT, [key], [
      windowStart,
      now,
      limit,
      window,
      `${now}:${crypto.randomUUID()}`,
    ]);

    return parseRateLimitScriptResult(result);
  } catch {
    // Redis errored — fall back to the in-memory floor rather than allowing all.
    return memoryRateLimit(identifier, limit, window);
  }
}

// In-memory daily budget fallback (PRD-024). Same per-instance caveat as
// memoryRateLimit: a floor when Redis is down, not a cluster-wide cap.
const memoryBudget = new Map<string, { count: number; resetAt: number }>();

function memoryCheckBudget(bucket: string, dailyLimit: number): { success: boolean; count: number } {
  const now = Date.now();
  const key = `budget:${bucket}`;
  const cur = memoryBudget.get(key);
  if (!cur || now >= cur.resetAt) {
    memoryBudget.set(key, { count: 1, resetAt: now + 86_400_000 });
    return { success: 1 <= dailyLimit, count: 1 };
  }
  cur.count += 1;
  return { success: cur.count <= dailyLimit, count: cur.count };
}

/**
 * Daily GLOBAL budget counter for a shared, expensive resource (e.g. LLM calls).
 * Independent of per-IP rate limiting — caps total daily usage regardless of caller.
 * When Redis is unavailable, falls back to a per-instance in-memory counter so an
 * expensive anonymous endpoint can't burn unlimited credits (PRD-024).
 */
export async function checkGlobalBudget(
  bucket: string,
  dailyLimit: number,
): Promise<{ success: boolean; count: number }> {
  if (!hasUpstashRedisEnv() || !redis) {
    return memoryCheckBudget(bucket, dailyLimit);
  }

  const key = `budget:${bucket}`;

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 86_400); // 24h TTL set once, on the first hit of the day
    }

    return { success: count <= dailyLimit, count };
  } catch {
    return memoryCheckBudget(bucket, dailyLimit);
  }
}
