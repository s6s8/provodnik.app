import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClientMock, getBookingMock, redirectMock, notFoundMock } =
  vi.hoisted(() => ({
    createSupabaseServerClientMock: vi.fn(),
    getBookingMock: vi.fn(),
    redirectMock: vi.fn(),
    notFoundMock: vi.fn(),
  }));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
  redirect: redirectMock,
}));

vi.mock("@/lib/flags", () => ({
  flags: { FEATURE_TR_DISPUTES: true },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

vi.mock("@/lib/supabase/bookings", () => ({
  getBooking: getBookingMock,
}));

vi.mock("@/lib/profile/resolve-display-name", () => ({
  resolveDisplayName: () => "Ирина Петрова",
}));

vi.mock("./dispute-form", () => ({
  DisputeForm: () => <div>Форма спора</div>,
}));

import DisputePage from "./page";

const baseBooking = {
  id: "booking-1",
  traveler_id: "traveler-1",
  guide_id: "guide-1",
  status: "confirmed",
  starts_at: null,
  ends_at: null,
  guide_profile: { profile: { full_name: "Ирина Петрова" } },
  traveler_request: { destination: "Карелия", starts_on: "2026-06-10", ends_on: null },
};

function mockSignedInTraveler() {
  createSupabaseServerClientMock.mockResolvedValue({
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: "traveler-1" } }, error: null }),
    },
  });
}

describe("TravelerBookingDisputePage status guard", () => {
  beforeEach(() => {
    createSupabaseServerClientMock.mockReset();
    getBookingMock.mockReset();
    redirectMock.mockReset();
    notFoundMock.mockReset();
  });

  it("allows opening a dispute on a completed booking", async () => {
    mockSignedInTraveler();
    getBookingMock.mockResolvedValue({ ...baseBooking, status: "completed" });

    const ui = await DisputePage({
      params: Promise.resolve({ bookingId: "booking-1" }),
      searchParams: Promise.resolve({}),
    });
    render(ui);

    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects to the booking page for a pending booking", async () => {
    mockSignedInTraveler();
    getBookingMock.mockResolvedValue({ ...baseBooking, status: "pending" });

    await DisputePage({
      params: Promise.resolve({ bookingId: "booking-1" }),
      searchParams: Promise.resolve({}),
    });

    expect(redirectMock).toHaveBeenCalledWith("/bookings/booking-1");
  });
});
