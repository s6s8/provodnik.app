import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { BookingWithDetails } from "@/lib/supabase/bookings";

const { createSupabaseServerClientMock, getBookingMock } = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
  getBookingMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

vi.mock("@/lib/supabase/bookings", () => ({
  getBooking: getBookingMock,
}));

vi.mock("@/lib/supabase/reviews", () => ({
  getReviewForBooking: vi.fn(),
}));

vi.mock("@/lib/profile/resolve-display-name", () => ({
  resolveDisplayName: () => "Ирина Петрова",
}));

vi.mock("@/components/bookings/booking-status-badge", () => ({
  BookingStatusBadge: ({ status }: { status: string }) => (
    <span>{status}</span>
  ),
}));

vi.mock("@/components/profile-avatar", () => ({
  ProfileAvatar: () => <span data-testid="profile-avatar" />,
}));

vi.mock("@/features/bookings/components/booking-ticket-trigger", () => ({
  BookingTicketTrigger: ({ listingTitle }: { listingTitle: string }) => (
    <span data-testid="ticket-listing-title">{listingTitle}</span>
  ),
}));

vi.mock("@/features/bookings/components/support-sidebar", () => ({
  SupportSidebar: () => <aside>Поддержка</aside>,
}));

vi.mock("@/features/disputes/components/open-dispute-button", () => ({
  OpenDisputeButton: () => <button type="button">Открыть спор</button>,
}));

vi.mock("@/features/reviews/components/FourAxisReviewForm", () => ({
  FourAxisReviewForm: () => <form />,
}));

vi.mock("./actions", () => ({
  openBookingThreadAction: vi.fn(),
}));

import TravelerBookingDetailPage from "./page";

const booking = {
  id: "booking-1",
  traveler_id: "traveler-1",
  guide_id: "guide-1",
  request_id: "request-1",
  offer_id: "offer-1",
  listing_id: null,
  status: "confirmed",
  party_size: 2,
  starts_at: null,
  ends_at: null,
  subtotal_minor: 1250000,
  deposit_minor: null,
  remainder_minor: null,
  currency: "RUB",
  cancellation_policy_snapshot: null,
  meeting_point: null,
  created_at: "2026-05-01T10:00:00.000Z",
  updated_at: "2026-05-02T10:00:00.000Z",
  guide_profile: {
    verification_status: "approved",
    profile: {
      full_name: "Ирина Петрова",
      phone: "+79990000000",
      avatar_url: null,
    },
  },
  traveler_request: {
    destination: "Карелия",
    starts_on: "2026-06-10",
    ends_on: null,
    participants_count: 2,
  },
  guide_offer: {
    price_minor: 1250000,
    currency: "RUB",
    message: null,
  },
} as unknown as BookingWithDetails;

describe("TravelerBookingDetailPage", () => {
  it("uses destination and date instead of the generic trip title fallback", async () => {
    createSupabaseServerClientMock.mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "traveler-1" } },
          error: null,
        }),
      },
    });
    getBookingMock.mockResolvedValueOnce(booking);

    const ui = await TravelerBookingDetailPage({
      params: Promise.resolve({ bookingId: "booking-1" }),
      searchParams: Promise.resolve({}),
    });
    render(ui);

    expect(screen.queryByText("Поездка")).toBeNull();
    expect(screen.queryByText(/имитац/i)).toBeNull();
    expect(screen.queryByText(/демо-режим/i)).toBeNull();
    expect(screen.getByTestId("ticket-listing-title")).toHaveTextContent(
      "Карелия, 10 июня 2026 г.",
    );
  });
});
