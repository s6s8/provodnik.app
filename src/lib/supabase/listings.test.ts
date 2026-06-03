import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient, ensureOpenModerationCase } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  ensureOpenModerationCase: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));
vi.mock("@/lib/supabase/moderation", () => ({
  ensureOpenModerationCase,
}));

import { publishListing } from "@/lib/supabase/listings";
import type { ListingRow, ListingStatusDb, Uuid } from "@/lib/supabase/types";

function makeListing(status: ListingStatusDb): ListingRow {
  return {
    id: "listing-1" as Uuid,
    guide_id: "guide-1" as Uuid,
    slug: "test-listing",
    title: "Test listing",
    region: "Moscow",
    city: null,
    category: "general",
    route_summary: null,
    description: null,
    duration_minutes: 120,
    max_group_size: 4,
    price_from_minor: 100_000,
    currency: "RUB",
    private_available: true,
    group_available: false,
    instant_book: false,
    meeting_point: null,
    inclusions: [],
    exclusions: [],
    cancellation_policy_key: "flexible",
    status,
    rejection_reason: null,
    featured_rank: null,
    image_url: null,
    created_at: "2026-06-03T00:00:00.000Z",
    updated_at: "2026-06-03T00:00:00.000Z",
    exp_type: null,
    format: null,
    movement_type: null,
    languages: [],
    currencies: ["RUB"],
    idea: null,
    route: null,
    theme: null,
    audience: null,
    facts: null,
    org_details: null,
    difficulty_level: null,
    included: [],
    not_included: [],
    accommodation: null,
    deposit_rate: 0,
    pickup_point_text: null,
    dropoff_point_text: null,
    vehicle_type: null,
    baggage_allowance: null,
    pii_gate_rate: 0,
    booking_cutoff_hours: 24,
    event_span_hours: null,
    instant_booking: false,
    average_rating: 0,
    review_count: 0,
  };
}

describe("publishListing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits a guide listing to the moderation queue", async () => {
    const existingListing = makeListing("draft");
    const pendingListing = makeListing("pending_review");

    const ownershipQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: existingListing,
        error: null,
      }),
    };
    const updateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: pendingListing,
        error: null,
      }),
    };
    const from = vi.fn()
      .mockReturnValueOnce(ownershipQuery)
      .mockReturnValueOnce(updateQuery);
    createSupabaseServerClient.mockResolvedValue({ from });
    ensureOpenModerationCase.mockResolvedValue({ id: "case-1" });

    const listing = await publishListing("listing-1", "guide-1");

    expect(updateQuery.update).toHaveBeenCalledWith({
      status: "pending_review",
    });
    expect(ensureOpenModerationCase).toHaveBeenCalledWith({
      subjectType: "listing",
      guideId: "guide-1",
      listingId: "listing-1",
      queueReason: "Проверка листинга администратором",
    });
    expect(listing.status).toBe("pending_review");
  });
});
