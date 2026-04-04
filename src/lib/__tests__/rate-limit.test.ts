import { beforeEach, describe, expect, mock, test } from "bun:test";

const redisMock = {
  zremrangebyscore: mock(async () => 0),
  zcard: mock(async () => 0),
  zadd: mock(async () => 1),
  expire: mock(async () => 1),
};

mock.module("../upstash/redis", () => ({
  redis: redisMock,
}));

const { rateLimit } = await import("../rate-limit");

describe("rateLimit", () => {
  beforeEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
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
