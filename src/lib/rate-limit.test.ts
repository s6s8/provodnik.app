import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { expire, incr } = vi.hoisted(() => ({
  expire: vi.fn(),
  incr: vi.fn(),
}));
vi.mock("@/lib/upstash/redis", () => ({ redis: { incr, expire } }));

import { checkGlobalBudget } from "./rate-limit";

const ORIGINAL_ENV = process.env;
beforeEach(() => {
  process.env = {
    ...ORIGINAL_ENV,
    STORAGE_KV_REST_API_URL: "https://x",
    STORAGE_KV_REST_API_TOKEN: "t",
  };
  incr.mockReset();
  expire.mockReset();
});
afterEach(() => {
  process.env = ORIGINAL_ENV;
});

describe("checkGlobalBudget", () => {
  it("allows the first hit and sets a 24h TTL", async () => {
    incr.mockResolvedValue(1);
    const r = await checkGlobalBudget("parse-llm", 5000);
    expect(r.success).toBe(true);
    expect(expire).toHaveBeenCalledWith("budget:parse-llm", 86_400);
  });

  it("rejects once the daily limit is exceeded", async () => {
    incr.mockResolvedValue(5001);
    const r = await checkGlobalBudget("parse-llm", 5000);
    expect(r.success).toBe(false);
    expect(expire).not.toHaveBeenCalled();
  });

  it("fails open when Redis env is absent", async () => {
    delete process.env.STORAGE_KV_REST_API_URL;
    const r = await checkGlobalBudget("parse-llm", 5000);
    expect(r.success).toBe(true);
  });
});
