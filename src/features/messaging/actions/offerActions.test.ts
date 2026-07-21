import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClientMock, notifyBookingCreated } = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
  notifyBookingCreated: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

vi.mock("@/lib/notifications/triggers", () => ({ notifyBookingCreated }));

import { acceptOffer, counterOffer, declineOffer } from "./offerActions";

function makeDeclineSupabase(updateResult: {
  data: { id: string } | null;
  error: { message: string } | null;
}) {
  const offerMaybeSingle = vi.fn().mockResolvedValue({
    data: {
      id: "offer-1",
      request_id: "request-1",
      status: "pending",
    },
    error: null,
  });
  const offerSelect = vi.fn(() => ({ eq: () => ({ maybeSingle: offerMaybeSingle }) }));

  const requestMaybeSingle = vi.fn().mockResolvedValue({
    data: { traveler_id: "traveler-1" },
    error: null,
  });
  const requestSelect = vi.fn(() => ({ eq: () => ({ maybeSingle: requestMaybeSingle }) }));

  const updateMaybeSingle = vi.fn().mockResolvedValue(updateResult);
  const updateSelect = vi.fn(() => ({ maybeSingle: updateMaybeSingle }));
  const statusEq = vi.fn(() => ({ select: updateSelect }));
  const idEq = vi.fn(() => ({ eq: statusEq }));
  const update = vi.fn(() => ({ eq: idEq }));

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "traveler-1" } },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      if (table === "guide_offers") {
        return { select: offerSelect, update };
      }

      return { select: requestSelect };
    }),
  };
  createSupabaseServerClientMock.mockResolvedValue(supabase);
  return { updateSelect };
}

function makeRpcSupabase(
  rpcResult: { data: unknown; error: { message: string } | null } = { data: null, error: null },
) {
  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "traveler-1" } },
        error: null,
      }),
    },
    from: vi.fn(),
    rpc: vi.fn().mockResolvedValue(rpcResult),
  };
  createSupabaseServerClientMock.mockResolvedValue(supabase);
  return supabase;
}

describe("offer actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts through the accept_offer RPC and returns the booking id", async () => {
    const supabase = makeRpcSupabase({ data: "booking-1", error: null });

    await expect(acceptOffer("offer-1")).resolves.toEqual({
      success: true,
      bookingId: "booking-1",
    });
    expect(supabase.rpc).toHaveBeenCalledWith("accept_offer", { p_offer_id: "offer-1" });
    // The offer/booking writes live in the RPC — no direct table access here.
    expect(supabase.from).not.toHaveBeenCalled();
  });

  // D21-10: this surface created the booking but told the guide nothing.
  it("notifies the guide when the traveler accepts from the message thread", async () => {
    makeRpcSupabase({ data: "booking-1", error: null });

    await acceptOffer("offer-1");

    expect(notifyBookingCreated).toHaveBeenCalledTimes(1);
    expect(notifyBookingCreated).toHaveBeenCalledWith("booking-1");
  });

  it("rejects accept when the RPC reports the offer is no longer pending", async () => {
    makeRpcSupabase({ data: null, error: { message: "offer_not_found" } });

    await expect(acceptOffer("offer-1")).rejects.toThrow(
      "Предложение уже не в статусе ожидания.",
    );
    expect(notifyBookingCreated).not.toHaveBeenCalled();
  });

  it("rejects decline when the conditional update affects no rows", async () => {
    const { updateSelect } = makeDeclineSupabase({ data: null, error: null });

    await expect(declineOffer("offer-1")).rejects.toThrow(
      "Предложение уже не в статусе ожидания.",
    );
    expect(updateSelect).toHaveBeenCalledWith("id");
  });

  it("performs counter-offer through one transactional RPC", async () => {
    const supabase = makeRpcSupabase();

    await expect(counterOffer("offer-1", 12000, "New terms")).resolves.toEqual({
      success: true,
    });

    expect(supabase.rpc).toHaveBeenCalledWith("counter_offer", {
      p_offer_id: "offer-1",
      p_price_minor: 12000,
      p_message: "New terms",
    });
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
