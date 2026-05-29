import { describe, expect, it } from "vitest";

import type {
  ConfirmedBookingSummary,
  TravelerRequestSummary,
} from "@/lib/supabase/traveler-requests";

import {
  mapBookingToTrip,
  mapRequestToPhase,
  mapRequestToTrip,
} from "./trip-card-mappers";

const baseRequest: TravelerRequestSummary = {
  id: "request-1",
  destination: "Элиста",
  region: "Калмыкия",
  interests: ["буддизм", "степь"],
  starts_on: "2026-09-10",
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
  starts_on: "2026-07-20",
  price_minor: 2450000,
  currency: "RUB",
  guide_id: "guide-1",
  guide_name: "Демо Гид",
  guide_avatar_url: "/avatars/guide.jpg",
  booking_thread_id: null,
};

describe("trip card mappers", () => {
  it("maps open requests with offers to awaiting_decision", () => {
    expect(mapRequestToPhase({ ...baseRequest, offer_count: 2 })).toBe(
      "awaiting_decision",
    );
  });

  it("maps open requests without offers to waiting_offers", () => {
    expect(mapRequestToPhase({ ...baseRequest, offer_count: 0 })).toBe(
      "waiting_offers",
    );
  });

  it("maps a traveler request summary to a TripCardModel", () => {
    expect(
      mapRequestToTrip({
        ...baseRequest,
        starts_on: "2026-09-10",
        ends_on: "2026-09-12",
        start_time: "09:30",
        budget_minor: 2450000,
        participants_count: 4,
        offer_count: 3,
      }),
    ).toMatchObject({
      id: "request-1",
      destination: "Элиста",
      startsOn: "2026-09-10",
      endsOn: "2026-09-12",
      startTime: "09:30",
      budget: { amount: 2450000, currency: "RUB" },
      participantsCount: 4,
      offerCount: 3,
      isOwnRequest: true,
      guideName: null,
      guideAvatarUrl: null,
      organizerName: null,
    });
  });

  it("maps a confirmed booking summary to a TripCardModel", () => {
    const trip = mapBookingToTrip(baseBooking);

    expect(trip).toMatchObject({
      id: "booking-1",
      destination: "Москва",
      startsOn: "2026-07-20",
      isOwnRequest: true,
      guideName: "Демо Гид",
      guideAvatarUrl: "/avatars/guide.jpg",
      organizerName: null,
      price: { amount: 2450000, currency: "RUB" },
    });
    expect(trip.routeStops).toBeUndefined();
    expect(trip.inclusions).toBeUndefined();
  });
});
