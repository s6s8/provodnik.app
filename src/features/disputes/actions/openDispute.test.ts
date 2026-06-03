import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClientMock, notifyDisputeOpenedMock } = vi.hoisted(
  () => ({
    createSupabaseServerClientMock: vi.fn(),
    notifyDisputeOpenedMock: vi.fn(),
  }),
);

vi.mock("@/lib/flags", () => ({
  flags: { FEATURE_TR_DISPUTES: true },
}));

vi.mock("@/lib/notifications/triggers", () => ({
  notifyDisputeOpened: notifyDisputeOpenedMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

import { openDispute } from "./openDispute";

function makeSupabase(opts: {
  user?: { id: string } | null;
  rpcResult?: { data: unknown; error: { message: string } | null };
}) {
  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: opts.user ?? { id: "user-1" } },
        error: null,
      }),
    },
    from: vi.fn(),
    rpc: vi.fn().mockResolvedValue(
      opts.rpcResult ?? { data: { dispute_id: "dispute-1" }, error: null },
    ),
  };
  createSupabaseServerClientMock.mockResolvedValue(supabase);
  return supabase;
}

describe("openDispute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notifyDisputeOpenedMock.mockResolvedValue(undefined);
  });

  it("opens the dispute through one RPC and notifies only after it commits", async () => {
    const supabase = makeSupabase({});

    await expect(openDispute("booking-1", "  reason  ")).resolves.toEqual({
      success: true,
      disputeId: "dispute-1",
    });

    expect(supabase.rpc).toHaveBeenCalledWith("open_dispute", {
      p_booking_id: "booking-1",
      p_reason: "reason",
    });
    expect(supabase.from).not.toHaveBeenCalled();
    expect(notifyDisputeOpenedMock).toHaveBeenCalledWith("dispute-1");
  });

  it("does not notify when the transactional dispute RPC fails", async () => {
    makeSupabase({
      rpcResult: { data: null, error: { message: "dispute_event_failed" } },
    });

    await expect(openDispute("booking-1", "reason")).rejects.toThrow(
      "dispute_event_failed",
    );
    expect(notifyDisputeOpenedMock).not.toHaveBeenCalled();
  });
});
