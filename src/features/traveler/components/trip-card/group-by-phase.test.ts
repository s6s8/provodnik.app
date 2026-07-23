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
  end_time: null,
  ends_on: null,
  budget_minor: null,
  participants_count: 2,
  status: "open",
  created_at: "2026-05-28T10:00:00.000Z",
  offer_count: 0,
  unread_offer_count: 0,
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
  status: "confirmed",
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

  it("places pending requests in waiting_offers and awaiting_decision", () => {
    const grouped = groupTripsByPhase({
      activeRequests: [
        {
          ...baseRequest,
          id: "pending-offers",
          destination: "Тула",
          offer_count: 0,
        },
        {
          ...baseRequest,
          id: "pending-decision",
          destination: "Казань",
          offer_count: 1,
        },
      ],
      confirmedBookings: [],
    });

    expect(grouped.waiting_offers[0]?.id).toBe("pending-offers");
    expect(grouped.awaiting_decision[0]?.id).toBe("pending-decision");
  });

  it("places active confirmed bookings in today and upcoming", () => {
    const grouped = groupTripsByPhase({
      activeRequests: [],
      confirmedBookings: [
        {
          ...baseBooking,
          booking_id: "active-today",
          destination: "Сочи",
          starts_on: "2026-05-28",
          status: "confirmed",
        },
        {
          ...baseBooking,
          booking_id: "active-upcoming",
          destination: "Суздаль",
          starts_on: "2026-06-10",
          status: "awaiting_guide_confirmation",
        },
      ],
    });

    expect(grouped.today[0]?.id).toBe("active-today");
    expect(grouped.upcoming[0]?.id).toBe("active-upcoming");
  });

  it("places cancelled and completed bookings in completed regardless of date", () => {
    const grouped = groupTripsByPhase({
      activeRequests: [],
      confirmedBookings: [
        {
          ...baseBooking,
          booking_id: "cancelled-booking",
          destination: "Отменённая",
          starts_on: "2026-06-08",
          status: "cancelled",
        },
        {
          ...baseBooking,
          booking_id: "completed-status-booking",
          destination: "Завершённая",
          starts_on: "2026-06-10",
          status: "completed",
        },
      ],
    });

    expect(grouped.upcoming).toEqual([]);
    expect(grouped.completed.map((trip) => trip.id)).toEqual([
      "completed-status-booking",
      "cancelled-booking",
    ]);
  });

  it("places terminal own requests in completed", () => {
    const grouped = groupTripsByPhase({
      activeRequests: [],
      confirmedBookings: [],
      terminalRequests: [
        {
          ...baseRequest,
          id: "cancelled-request",
          destination: "Отменённый запрос",
          status: "cancelled",
          starts_on: "2026-05-10",
        },
        {
          ...baseRequest,
          id: "expired-request",
          destination: "Истёкший запрос",
          status: "expired",
          starts_on: "2026-05-20",
        },
      ],
    });

    expect(grouped.completed.map((trip) => trip.id)).toEqual([
      "expired-request",
      "cancelled-request",
    ]);
  });

  it("sorts completed trips most-recent first", () => {
    const grouped = groupTripsByPhase({
      activeRequests: [],
      confirmedBookings: [
        {
          ...baseBooking,
          booking_id: "older-completed",
          starts_on: "2026-05-10",
        },
        {
          ...baseBooking,
          booking_id: "newer-completed",
          starts_on: "2026-05-20",
        },
      ],
    });

    expect(grouped.completed.map((trip) => trip.id)).toEqual([
      "newer-completed",
      "older-completed",
    ]);
  });

  it("does not duplicate a joined group when a booking exists for the same request", () => {
    const grouped = groupTripsByPhase({
      activeRequests: [],
      confirmedBookings: [
        {
          ...baseBooking,
          booking_id: "booking-for-group",
          request_id: "joined-group-1",
          destination: "Кострома",
          starts_on: "2026-06-10",
        },
      ],
      joinedGroups: [
        {
          id: "joined-group-1",
          destination: "Кострома",
          region: "Золотое кольцо",
          starts_on: "2026-06-10",
          start_time: "11:00",
          ends_on: null,
          budget_minor: 1800000,
          participants_count: 3,
          group_max: 6,
          status: "booked",
          joined_at: "2026-05-28T11:00:00.000Z",
          owner_id: "traveler-owner-1",
          owner_name: "Мария К.",
          owner_avatar_url: "/avatars/maria.jpg",
        },
      ],
    });

    expect(grouped.upcoming).toHaveLength(1);
    expect(grouped.upcoming[0]?.id).toBe("booking-for-group");
  });
});
