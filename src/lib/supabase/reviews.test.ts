import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseAdminClient, createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseAdminClient: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/notifications/create-notification", () => ({
  createNotification: vi.fn(),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient,
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

import { getReviewForBooking } from "@/lib/supabase/reviews";

describe("getReviewForBooking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when the authenticated user is not the booking traveler", async () => {
    const reviewSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const reviewEq = vi.fn(() => ({ maybeSingle: reviewSingle }));
    const reviewSelect = vi.fn(() => ({ eq: reviewEq }));
    createSupabaseAdminClient.mockReturnValue({
      from: vi.fn(() => ({ select: reviewSelect })),
    });

    const bookingSingle = vi.fn().mockResolvedValue({
      data: { id: "booking-1", traveler_id: "traveler-1" },
      error: null,
    });
    const bookingEq = vi.fn(() => ({ maybeSingle: bookingSingle }));
    const bookingSelect = vi.fn(() => ({ eq: bookingEq }));
    const serverClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "traveler-2" } },
          error: null,
        }),
      },
      from: vi.fn(() => ({ select: bookingSelect })),
    };
    createSupabaseServerClient.mockResolvedValue(serverClient);

    await expect(getReviewForBooking("booking-1")).rejects.toThrow(
      "Нет доступа к отзыву по этому бронированию.",
    );

    expect(reviewSelect).not.toHaveBeenCalled();
  });
});
