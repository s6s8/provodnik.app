import { describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient, createSupabaseAdminClient, getOrCreateThread } = vi.hoisted(
  () => ({
    createSupabaseServerClient: vi.fn(),
    createSupabaseAdminClient: vi.fn(),
    getOrCreateThread: vi.fn(),
  }),
);

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient,
}));

vi.mock("@/lib/supabase/conversations", () => ({
  getOrCreateThread,
}));

import {
  buildOfferOpeningMetadata,
  ensureOfferConversation,
  formatDestinationLabel,
} from "./offer-conversation";

const baseRequest = {
  destination: "Казань",
  region: "Татарстан",
  starts_on: "2026-09-10",
  start_time: "10:00:00",
  end_time: "13:00:00",
  date_flexibility: "exact",
};

const baseOffer = {
  id: "offer-1",
  price_minor: 500_000,
  currency: "RUB",
  message: "Готов провести экскурсию по центру города.",
  status: "pending" as const,
  expires_at: "2027-01-01T00:00:00.000Z",
};

describe("buildOfferOpeningMetadata", () => {
  it("keys the opening bundle to the offer id", () => {
    expect(buildOfferOpeningMetadata("offer-1").opening_key).toBe(
      "offer_conversation_opening_v1:offer-1",
    );
  });
});

describe("ensureOfferConversation", () => {
  it("creates context and offer-card messages once", async () => {
    getOrCreateThread.mockResolvedValue({ id: "thread-1", participants: [] });

    const openingMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });

    const openingContains = vi.fn(() => ({
      limit: vi.fn(() => ({ maybeSingle: openingMaybeSingle })),
    }));
    const openingEq = vi.fn(() => ({ contains: openingContains }));
    const openingSelect = vi.fn(() => ({ eq: openingEq }));

    const guideMaybeSingle = vi.fn().mockResolvedValue({
      data: { full_name: "Иван" },
      error: null,
    });
    const guideEq = vi.fn(() => ({ maybeSingle: guideMaybeSingle }));
    const guideSelect = vi.fn(() => ({ eq: guideEq }));

    const adminInsert = vi.fn().mockResolvedValue({ error: null });
    const adminFrom = vi.fn(() => ({ insert: adminInsert }));

    createSupabaseServerClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "messages") return { select: openingSelect };
        if (table === "v_guide_public_profile") return { select: guideSelect };
        throw new Error(`unexpected table ${table}`);
      }),
    });
    createSupabaseAdminClient.mockReturnValue({ from: adminFrom });

    const result = await ensureOfferConversation({
      offer: baseOffer,
      guideId: "guide-1",
      travelerId: "traveler-1",
      request: baseRequest,
    });

    expect(result).toEqual({ threadId: "thread-1", created: true });
    expect(getOrCreateThread).toHaveBeenCalledWith("offer", "offer-1", "guide-1", [
      "traveler-1",
    ]);
    expect(adminInsert).toHaveBeenCalledTimes(2);
    expect(adminInsert.mock.calls[0]?.[0]).toMatchObject({
      thread_id: "thread-1",
      sender_role: "system",
      metadata: expect.objectContaining({
        event_type: "bid_submitted",
        listing_title: "Казань, Татарстан",
      }),
    });
    expect(adminInsert.mock.calls[1]?.[0]).toMatchObject({
      metadata: expect.objectContaining({
        system_event_type: "offer_sent",
        system_event_payload: expect.objectContaining({ offer_id: "offer-1" }),
      }),
    });
  });

  it("is idempotent when the opening bundle already exists", async () => {
    getOrCreateThread.mockResolvedValue({ id: "thread-1", participants: [] });

    const openingMaybeSingle = vi.fn().mockResolvedValue({ data: { id: "msg-1" }, error: null });
    const openingContains = vi.fn(() => ({
      limit: vi.fn(() => ({ maybeSingle: openingMaybeSingle })),
    }));
    const openingEq = vi.fn(() => ({ contains: openingContains }));
    const openingSelect = vi.fn(() => ({ eq: openingEq }));

    createSupabaseServerClient.mockResolvedValue({
      from: vi.fn(() => ({ select: openingSelect })),
    });

    const adminInsert = vi.fn();
    createSupabaseAdminClient.mockReturnValue({
      from: vi.fn(() => ({ insert: adminInsert })),
    });

    const result = await ensureOfferConversation({
      offer: baseOffer,
      guideId: "guide-1",
      travelerId: "traveler-1",
      request: baseRequest,
    });

    expect(result).toEqual({ threadId: "thread-1", created: false });
    expect(adminInsert).not.toHaveBeenCalled();
  });
});

describe("formatDestinationLabel", () => {
  it("includes region when present", () => {
    expect(
      formatDestinationLabel({
        destination: "Казань",
        region: "Татарстан",
        starts_on: "2026-09-10",
      }),
    ).toBe("Казань, Татарстан");
  });
});
