import { readFileSync } from "node:fs";

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createSupabaseServerClientMock,
  getBookingMock,
  getReviewForBookingMock,
} = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
  getBookingMock: vi.fn(),
  getReviewForBookingMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/flags", () => ({
  flags: {
    FEATURE_TR_DISPUTES: true,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

vi.mock("@/lib/supabase/bookings", () => ({
  getBooking: getBookingMock,
}));

vi.mock("@/lib/supabase/reviews", () => ({
  getReviewForBooking: getReviewForBookingMock,
}));

vi.mock("@/lib/profile/resolve-display-name", () => ({
  resolveDisplayName: () => "Ирина Петрова",
}));

vi.mock("@/features/traveler/components/reviews/traveler-booking-review-screen", () => ({
  TravelerBookingReviewScreen: ({
    booking,
  }: {
    booking: { destination: string; guideName: string };
  }) => (
    <section>
      <h1>Оставить отзыв</h1>
      <p>{booking.destination}</p>
      <p>{booking.guideName}</p>
    </section>
  ),
}));

vi.mock("./review/actions", () => ({
  submitReview: vi.fn(),
}));

vi.mock("./dispute/actions", () => ({
  submitDispute: vi.fn(),
}));

import DisputePage from "./dispute/page";
import ReviewPage from "./review/page";

const booking = {
  id: "booking-1",
  traveler_id: "traveler-1",
  guide_id: "guide-1",
  listing_id: null,
  status: "completed",
  starts_at: null,
  ends_at: null,
  guide_profile: {
    verification_status: "approved",
    profile: {
      full_name: "Ирина Петрова",
      avatar_url: null,
    },
  },
  traveler_request: {
    destination: "Карелия",
    starts_on: "2026-06-10",
    ends_on: null,
  },
};

function mockSignedInTraveler() {
  createSupabaseServerClientMock.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "traveler-1" } },
        error: null,
      }),
    },
  });
}

describe("canonical booking review and dispute pages", () => {
  beforeEach(() => {
    createSupabaseServerClientMock.mockReset();
    getBookingMock.mockReset();
    getReviewForBookingMock.mockReset();
  });

  it("renders the moved review page for the booking traveler", async () => {
    mockSignedInTraveler();
    getBookingMock.mockResolvedValue(booking);
    getReviewForBookingMock.mockResolvedValue(null);

    const ui = await ReviewPage({
      params: Promise.resolve({ bookingId: "booking-1" }),
      searchParams: Promise.resolve({}),
    });
    render(ui);

    expect(screen.getByRole("heading", { name: "Оставить отзыв" })).toBeInTheDocument();
    expect(screen.getByText("Карелия")).toBeInTheDocument();
    expect(screen.getByText("Ирина Петрова")).toBeInTheDocument();
  });

  it("renders the moved dispute page for the booking traveler", async () => {
    mockSignedInTraveler();
    getBookingMock.mockResolvedValue({
      ...booking,
      status: "confirmed",
    });

    const ui = await DisputePage({
      params: Promise.resolve({ bookingId: "booking-1" }),
      searchParams: Promise.resolve({}),
    });
    render(ui);

    expect(screen.getByRole("heading", { name: "Открыть спор" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Вернуться к поездке" })).toHaveAttribute(
      "href",
      "/bookings/booking-1",
    );
  });

  it("keeps the canonical copied files free of old traveler booking URLs", () => {
    const oldTravelerBookingPath = ["/traveler", "bookings"].join("/");
    const files = [
      "./review/page.tsx",
      "./review/actions.ts",
      "./review/loading.tsx",
      "./dispute/page.tsx",
      "./dispute/actions.ts",
    ];

    for (const file of files) {
      expect(readFileSync(new URL(file, import.meta.url), "utf8")).not.toContain(
        oldTravelerBookingPath,
      );
    }
  });
});
