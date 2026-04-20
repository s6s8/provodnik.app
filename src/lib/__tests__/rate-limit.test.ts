import { beforeEach, describe, expect, test, vi } from "vitest";
import { rateLimit } from "../rate-limit";

const redisMock = vi.hoisted(() => ({
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
    redisMock.zremrangebyscore.mockClear();
    redisMock.zcard.mockClear();
    redisMock.zadd.mockClear();
    redisMock.expire.mockClear();
  });

  test("allows requests within the sliding window", async () => {
    redisMock.zremrangebyscore.mockResolvedValueOnce(0);
    redisMock.zcard.mockResolvedValueOnce(2);
    redisMock.zadd.mockResolvedValueOnce(1);
    redisMock.expire.mockResolvedValueOnce(1);

    const result = await rateLimit("messages:127.0.0.1", 5, 60);

    expect(result).toEqual({
      success: true,
      remaining: 2,
    });
  });

  test("blocks requests when the limit is reached", async () => {
    redisMock.zremrangebyscore.mockResolvedValueOnce(0);
    redisMock.zcard.mockResolvedValueOnce(5);

    const result = await rateLimit("messages:127.0.0.1", 5, 60);

    expect(result).toEqual({
      success: false,
      remaining: 0,
    });
    expect(redisMock.zadd).toHaveBeenCalledTimes(0);
  });

  test("fails open when Redis is unavailable", async () => {
    redisMock.zremrangebyscore.mockRejectedValueOnce(new Error("redis down"));

    const result = await rateLimit("messages:127.0.0.1", 5, 60);

    expect(result).toEqual({
      success: true,
      remaining: 5,
    });
  });
});
