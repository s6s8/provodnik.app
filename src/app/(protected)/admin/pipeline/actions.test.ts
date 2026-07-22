import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  logAdminAudit: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/moderation", () => ({
  requireAdminSession: mocks.requireAdminSession,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));

vi.mock("@/lib/supabase/admin-users", () => ({
  logAdminAudit: mocks.logAdminAudit,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  blockTravelerRequestAction,
  unblockTravelerRequestAction,
} from "./actions";

describe("admin pipeline request actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminSession.mockResolvedValue({ adminId: "admin-1" });
    mocks.createSupabaseServerClient.mockResolvedValue({ rpc: mocks.rpc });
    mocks.rpc.mockResolvedValue({ error: null });
    mocks.logAdminAudit.mockResolvedValue(undefined);
  });

  it("blocks an open request through the admin RPC", async () => {
    const result = await blockTravelerRequestAction(
      "53000000-0000-4000-8000-0000000000a1",
      "спам в описании",
    );

    expect(result.ok).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith("admin_block_traveler_request", {
      p_request_id: "53000000-0000-4000-8000-0000000000a1",
      p_reason: "спам в описании",
    });
    expect(mocks.logAdminAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "request.block",
        targetType: "traveler_request",
      }),
    );
  });

  it("rejects block without a reason", async () => {
    const result = await blockTravelerRequestAction(
      "53000000-0000-4000-8000-0000000000a1",
      "  ",
    );

    expect(result.ok).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("unblocks through the admin RPC", async () => {
    const result = await unblockTravelerRequestAction(
      "53000000-0000-4000-8000-0000000000a1",
    );

    expect(result.ok).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith("admin_unblock_traveler_request", {
      p_request_id: "53000000-0000-4000-8000-0000000000a1",
    });
  });

  it("maps RPC failures to Russian messages", async () => {
    mocks.rpc.mockResolvedValue({ error: { message: "not_blockable" } });

    const result = await blockTravelerRequestAction(
      "53000000-0000-4000-8000-0000000000a1",
      "нарушение правил",
    );

    expect(result.ok).toBe(false);
    expect(result.error).toContain("открытый");
  });
});
