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

  it("does not put closed requests into active offer phases", () => {
    expect(
      mapRequestToPhase({ ...baseRequest, status: "cancelled", offer_count: 2 }),
    ).toBe("completed");
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
      createdAt: "2026-05-28T10:00:00.000Z",
      interests: ["буддизм", "степь"],
      mode: "private",
      groupMax: null,
      isOwnRequest: true,
      guideName: null,
      guideAvatarUrl: null,
      organizerName: null,
    });
  });

  it("maps a confirmed booking summary to a TripCardModel", () => {
    const bookingWithItinerary = {
      ...baseBooking,
      starts_on: "2026-07-20",
      ends_on: "2026-07-21",
      start_time: "09:30:00",
      participants_count: 0,
      route_stops: [{ photoUrl: "/route.jpg", address: "Площадь" }],
      inclusions: ["входные билеты"],
    } as ConfirmedBookingSummary & {
      ends_on: string;
      start_time: string;
      participants_count: number;
      route_stops: { photoUrl: string; address: string }[];
      inclusions: string[];
    };

    const trip = mapBookingToTrip(bookingWithItinerary);

    expect(trip).toMatchObject({
      id: "booking-1",
      destination: "Москва",
      startsOn: "2026-07-20",
      endsOn: "2026-07-21",
      startTime: "09:30",
      participantsCount: 0,
      isOwnRequest: true,
      guideName: "Демо Гид",
      guideAvatarUrl: "/avatars/guide.jpg",
      organizerName: null,
      price: { amount: 2450000, currency: "RUB" },
      routeStops: [{ photoUrl: "/route.jpg", address: "Площадь" }],
      inclusions: ["входные билеты"],
    });
  });
});
