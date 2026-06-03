import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createSupabaseBrowserClient,
  createSupabaseServerClient,
  hasSupabaseEnv,
} = vi.hoisted(() => ({
  createSupabaseBrowserClient: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  hasSupabaseEnv: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv,
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

import { recordMarketplaceEventFromClient } from "./client";

describe("recordMarketplaceEventFromClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasSupabaseEnv.mockReturnValue(true);
  });

  it("records events through the cookie-bound server client RPC", async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-from-auth" } },
      error: null,
    });
    const rpc = vi.fn().mockResolvedValue({ error: null });

    createSupabaseServerClient.mockResolvedValue({
      auth: { getUser },
      rpc,
    });

    await recordMarketplaceEventFromClient({
      scope: "request",
      requestId: "request-1",
      actorId: "spoofed-actor",
      eventType: "offer_declined",
      summary: "Offer declined",
      detail: "Traveler declined the offer",
      payload: { source: "test" },
    });

    expect(createSupabaseBrowserClient).not.toHaveBeenCalled();
    expect(createSupabaseServerClient).toHaveBeenCalledOnce();
    expect(getUser).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith("record_marketplace_event", {
      p_scope: "request",
      p_request_id: "request-1",
      p_booking_id: null,
      p_dispute_id: null,
      p_event_type: "offer_declined",
      p_summary: "Offer declined",
      p_detail: "Traveler declined the offer",
      p_payload: { source: "test" },
    });
  });
});
