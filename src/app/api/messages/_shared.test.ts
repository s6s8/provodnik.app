import { describe, expect, it, vi, beforeEach } from "vitest";

const { createSupabaseServerClient, rateLimit } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv: () => true,
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

import { authenticateMessagesRequest } from "./_shared";

describe("authenticateMessagesRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
    });
    rateLimit.mockResolvedValue({ success: true, remaining: 29 });
  });

  it("rate-limits by authenticated user id, not client IP", async () => {
    const result = await authenticateMessagesRequest();

    expect(result.kind).toBe("ok");
    expect(rateLimit).toHaveBeenCalledWith("api:messages:user:user-1", 30, 60);
  });

  it("returns unauthorized before rate limiting when there is no session", async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    });

    const result = await authenticateMessagesRequest();

    expect(result).toEqual({
      kind: "unauthorized",
      remaining: 30,
    });
    expect(rateLimit).not.toHaveBeenCalled();
  });
});
