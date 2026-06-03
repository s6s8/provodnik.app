import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ConfirmedBookingSummary,
  TravelerRequestSummary,
} from "@/lib/supabase/traveler-requests";

import { groupTripsByPhase } from "./group-by-phase";

const baseRequest: TravelerRequestSummary = {
  id: "request-1",
  destination: "Элиста",
  region: "Калмыкия",
  interests: ["буддизм"],
  starts_on: "2026-06-01",
  start_time: null,
  ends_on: null,
  budget_minor: null,
  participants_count: 2,
  status: "open",
  created_at: "2026-05-28T10:00:00.000Z",
  offer_count: 0,
  guide_avatars: [],
  mode: "private",
  group_max: null,
};

const baseBooking: ConfirmedBookingSummary = {
  booking_id: "booking-1",
  request_id: "request-1",
  destination: "Москва",
  starts_on: "2026-06-01",
  price_minor: 2450000,
  currency: "RUB",
  guide_id: "guide-1",
  guide_name: "Демо Гид",
  guide_avatar_url: "/avatars/guide.jpg",
  booking_thread_id: null,
};

describe("groupTripsByPhase", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-28T12:00:00+04:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns all phase keys with empty arrays for empty input", () => {
    expect(
      groupTripsByPhase({ activeRequests: [], confirmedBookings: [] }),
    ).toEqual({
      today: [],
      upcoming: [],
      awaiting_decision: [],
      waiting_offers: [],
      completed: [],
    });
  });

  it("groups mixed requests and bookings into their phases", () => {
    const grouped = groupTripsByPhase({
      activeRequests: [
        {
          ...baseRequest,
          id: "awaiting-decision",
          destination: "Казань",
          offer_count: 2,
        },
        {
          ...baseRequest,
          id: "waiting-offers",
          destination: "Тула",
          offer_count: 0,
        },
      ],
      confirmedBookings: [
        {
          ...baseBooking,
          booking_id: "today-booking",
          destination: "Сочи",
          starts_on: "2026-05-28",
        },
        {
          ...baseBooking,
          booking_id: "upcoming-booking",
          destination: "Суздаль",
          starts_on: "2026-06-10",
        },
      ],
    });

    expect(grouped.today).toHaveLength(1);
    expect(grouped.today[0]?.id).toBe("today-booking");
    expect(grouped.upcoming).toHaveLength(1);
    expect(grouped.upcoming[0]?.id).toBe("upcoming-booking");
    expect(grouped.awaiting_decision[0]?.id).toBe("awaiting-decision");
    expect(grouped.waiting_offers[0]?.id).toBe("waiting-offers");
    expect(grouped.completed).toEqual([]);
  });

  it("buckets a booking that starts today into today", () => {
    const grouped = groupTripsByPhase({
      activeRequests: [],
      confirmedBookings: [
        {
          ...baseBooking,
          booking_id: "today-booking",
          starts_on: "2026-05-28",
        },
      ],
    });

    expect(grouped.today).toHaveLength(1);
    expect(grouped.upcoming).toEqual([]);
    expect(grouped.completed).toEqual([]);
  });

  it("buckets a past booking into completed", () => {
    const grouped = groupTripsByPhase({
      activeRequests: [],
      confirmedBookings: [
        {
          ...baseBooking,
          booking_id: "completed-booking",
          starts_on: "2026-05-20",
        },
      ],
    });

    expect(grouped.completed).toHaveLength(1);
    expect(grouped.completed[0]?.id).toBe("completed-booking");
  });

  it("keeps bookings with missing start dates out of completed", () => {
    const grouped = groupTripsByPhase({
      activeRequests: [],
      confirmedBookings: [
        {
          ...baseBooking,
          booking_id: "missing-date-booking",
          starts_on: "",
        },
      ],
    });

    expect(grouped.upcoming[0]?.id).toBe("missing-date-booking");
    expect(grouped.completed).toEqual([]);
  });
});
