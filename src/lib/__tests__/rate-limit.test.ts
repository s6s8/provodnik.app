import { beforeEach, describe, expect, test, vi } from "vitest";
import { rateLimit } from "../rate-limit";

const redisMock = vi.hoisted(() => ({
  eval: vi.fn(),
  zremrangebyscore: vi.fn(),
  zcard: vi.fn(),
  zadd: vi.fn(),
  expire: vi.fn(),
}));

vi.mock("@/lib/upstash/redis", () => ({
  redis: redisMock,
}));

describe("rateLimit", () => {
  beforeEach(() => {
    process.env.STORAGE_KV_REST_API_URL = "https://example.upstash.io";
    process.env.STORAGE_KV_REST_API_TOKEN = "token";
    redisMock.eval.mockClear();
    redisMock.zremrangebyscore.mockClear();
    redisMock.zcard.mockClear();
    redisMock.zadd.mockClear();
    redisMock.expire.mockClear();
  });

  test("allows requests within the sliding window", async () => {
    redisMock.eval.mockResolvedValueOnce([1, 2]);

    const result = await rateLimit("messages:127.0.0.1", 5, 60);

    expect(result).toEqual({
      success: true,
      remaining: 2,
    });
    expect(redisMock.eval).toHaveBeenCalledTimes(1);
    expect(redisMock.zremrangebyscore).toHaveBeenCalledTimes(0);
    expect(redisMock.zcard).toHaveBeenCalledTimes(0);
    expect(redisMock.zadd).toHaveBeenCalledTimes(0);
    expect(redisMock.expire).toHaveBeenCalledTimes(0);
  });

  test("blocks requests when the limit is reached", async () => {
    redisMock.eval.mockResolvedValueOnce([0, 0]);

    const result = await rateLimit("messages:127.0.0.1", 5, 60);

    expect(result).toEqual({
      success: false,
      remaining: 0,
    });
  });

  test("fails open when Redis is unavailable", async () => {
    redisMock.eval.mockRejectedValueOnce(new Error("redis down"));

    const result = await rateLimit("messages:127.0.0.1", 5, 60);

    expect(result).toEqual({
      success: true,
      remaining: 5,
    });
  });

  test("normalizes forgot-password email identifiers before keying", async () => {
    redisMock.eval.mockResolvedValueOnce([1, 4]);

    await rateLimit("forgot-password: USER@Example.COM ", 5, 3600);

    expect(redisMock.eval).toHaveBeenCalledOnce();
    expect(redisMock.eval.mock.calls[0]?.[1]).toEqual([
      "rate-limit:forgot-password:user@example.com:5:3600",
    ]);
  });
});
