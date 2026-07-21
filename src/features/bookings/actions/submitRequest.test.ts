import { beforeEach, describe, expect, it, vi } from "vitest";

// submitRequest now routes through the canonical createTravelerRequest service
// (destination sanitization + validation + correct lock defaults) after the same
// active-account gate as the homepage path, then notifies guides + logs the funnel.
const { createClient, mockListingSingle, mockProfileSingle, createTravelerRequestMock } =
  vi.hoisted(() => {
    const listingSingle = vi.fn();
    const profileSingle = vi.fn();
    const client = vi.fn(async () => ({
      auth: { getUser: async () => ({ data: { user: { id: "traveler-1" } } }) },
      from: (table: string) => {
        if (table === "listings") {
          return { select: () => ({ eq: () => ({ single: listingSingle }) }) };
        }
        if (table === "profiles") {
          return { select: () => ({ eq: () => ({ maybeSingle: profileSingle }) }) };
        }
        throw new Error(`Unexpected table: ${table}`);
      },
    }));
    return {
      createClient: client,
      mockListingSingle: listingSingle,
      mockProfileSingle: profileSingle,
      createTravelerRequestMock: vi.fn(),
    };
  });

const listingId = "550e8400-e29b-41d4-a716-446655440000";
const guideId = "650e8400-e29b-41d4-a716-446655440000";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: createClient }));
vi.mock("@/lib/supabase/requests", () => ({
  createTravelerRequest: createTravelerRequestMock,
}));
vi.mock("@/lib/notifications/triggers", () => ({ notifyGuidesNewRequest: vi.fn() }));
vi.mock("@/lib/analytics/marketplace-events", () => ({ logFunnelEvent: vi.fn() }));

import { submitRequest } from "./submitRequest";

describe("submitRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListingSingle.mockResolvedValue({
      data: { id: listingId, guide_id: guideId, status: "published", price_from_minor: 100000 },
      error: null,
    });
    mockProfileSingle.mockResolvedValue({ data: { account_status: "active" }, error: null });
    createTravelerRequestMock.mockResolvedValue({ id: "request-1" });
  });

  it("routes through the canonical service with open lock defaults + interest mapping", async () => {
    await expect(
      submitRequest({
        listingId,
        guideId,
        destination: "Элиста",
        region: "Калмыкия",
        category: "history_culture",
        startsOn: "2026-06-10",
        participantsCount: 2,
        formatPreference: "group",
        mode: "order",
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/requests/request-1");

    expect(createTravelerRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        open_to_join: true,
        interests: ["history_culture"],
        date_locked: false,
        time_locked: false,
        format_preference: "group",
      }),
      "traveler-1",
    );
  });

  it("hands the verified listing to the service so the DB derives the addressee", async () => {
    await expect(
      submitRequest({
        listingId,
        guideId,
        destination: "Элиста",
        region: "Калмыкия",
        category: "history_culture",
        startsOn: "2026-06-10",
        participantsCount: 2,
        mode: "order",
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/requests/request-1");

    // The listing is the derivation source; no guide id is ever passed as an addressee,
    // so nothing this action sends can become target_guide_id on its own.
    expect(createTravelerRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({ listing_id: listingId }),
      "traveler-1",
    );
    expect(createTravelerRequestMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ target_guide_id: expect.anything() }),
      expect.anything(),
    );
  });

  it("fails closed when the listing does not belong to the claimed guide", async () => {
    mockListingSingle.mockResolvedValueOnce({
      data: {
        id: listingId,
        guide_id: "750e8400-e29b-41d4-a716-446655440000",
        status: "published",
        price_from_minor: 100000,
      },
      error: null,
    });

    await expect(
      submitRequest({
        listingId,
        guideId,
        destination: "Элиста",
        region: "Калмыкия",
        category: "history_culture",
        startsOn: "2026-06-10",
        participantsCount: 2,
        mode: "order",
      }),
    ).rejects.toThrow("listing_unavailable");

    expect(createTravelerRequestMock).not.toHaveBeenCalled();
  });

  it("blocks a restricted account before creating anything", async () => {
    mockProfileSingle.mockResolvedValueOnce({ data: { account_status: "suspended" }, error: null });

    await expect(
      submitRequest({
        listingId,
        guideId,
        destination: "Элиста",
        region: "Калмыкия",
        category: "history",
        startsOn: "2026-06-10",
        participantsCount: 2,
        mode: "order",
      }),
    ).rejects.toThrow("account_restricted");

    expect(createTravelerRequestMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid payload before creating the Supabase client", async () => {
    await expect(
      submitRequest({
        listingId: "not-a-uuid",
        guideId: "x",
        destination: "",
        region: "",
        category: "",
        startsOn: "bad",
        participantsCount: 0,
      }),
    ).rejects.toThrow("invalid_input");

    expect(createClient).not.toHaveBeenCalled();
  });
});
