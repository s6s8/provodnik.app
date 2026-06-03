import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClientMock, recalculateGuideStatsMock } = vi.hoisted(
  () => ({
    createSupabaseServerClientMock: vi.fn(),
    recalculateGuideStatsMock: vi.fn(),
  }),
);

vi.mock("@/lib/supabase/reviews", () => ({
  recalculateGuideStats: recalculateGuideStatsMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

import { submitReview } from "./submitReview";

const validInput = {
  bookingId: "booking-1",
  guideId: "guide-1",
  listingId: "listing-1",
  overall: 5,
  material: 5,
  engagement: 5,
  knowledge: 5,
  route: 5,
  body: "Excellent route",
};

function makeSupabase() {
  const insertSingle = vi.fn().mockResolvedValue({
    data: { id: "review-1" },
    error: null,
  });
  const reviewInsert = vi.fn(() => ({
    select: () => ({ single: insertSingle }),
  }));
  const existingMaybeSingle = vi.fn().mockResolvedValue({
    data: null,
    error: null,
  });
  const reviewsSelect = vi.fn(() => ({
    eq: () => ({ maybeSingle: existingMaybeSingle }),
  }));

  const bookingMaybeSingle = vi.fn().mockResolvedValue({
    data: {
      id: "booking-1",
      traveler_id: "traveler-1",
      guide_id: "guide-1",
      listing_id: "listing-1",
      status: "completed",
    },
    error: null,
  });
  const bookingSelect = vi.fn(() => ({
    eq: () => ({ maybeSingle: bookingMaybeSingle }),
  }));

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "traveler-1" } },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      if (table === "bookings") return { select: bookingSelect };
      if (table === "reviews") return { select: reviewsSelect, insert: reviewInsert };
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    }),
    rpc: vi.fn().mockResolvedValue({
      data: { review_id: "review-1" },
      error: null,
    }),
  };
  createSupabaseServerClientMock.mockResolvedValue(supabase);
  return { supabase, reviewInsert };
}

describe("submitReview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recalculateGuideStatsMock.mockResolvedValue(undefined);
  });

  it("validates all axis scores before inserting a review", async () => {
    const { reviewInsert } = makeSupabase();

    await expect(
      submitReview({ ...validInput, material: 6 }),
    ).rejects.toThrow('Оценка "material" должна быть целым числом от 1 до 5.');

    expect(reviewInsert).not.toHaveBeenCalled();
  });

  it("submits the review and breakdown through one transactional RPC", async () => {
    const { supabase } = makeSupabase();

    await expect(submitReview(validInput)).resolves.toEqual({
      reviewId: "review-1",
    });

    expect(supabase.rpc).toHaveBeenCalledWith("submit_review", {
      p_booking_id: "booking-1",
      p_guide_id: "guide-1",
      p_listing_id: "listing-1",
      p_overall: 5,
      p_body: "Excellent route",
      p_material: 5,
      p_engagement: 5,
      p_knowledge: 5,
      p_route: 5,
    });
    expect(recalculateGuideStatsMock).toHaveBeenCalledWith("guide-1");
  });
});
