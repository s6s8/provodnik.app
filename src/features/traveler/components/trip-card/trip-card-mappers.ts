import type {
  ConfirmedBookingSummary,
  TravelerRequestSummary,
} from "@/lib/supabase/traveler-requests";

import type { TripCardModel, TripPhase } from "./trip-card-types";

export function mapRequestToPhase(
  request: TravelerRequestSummary,
): TripPhase {
  if (request.status !== "open") {
    return "completed";
  }

  if (request.status === "open" && request.offer_count > 0) {
    return "awaiting_decision";
  }

  return "waiting_offers";
}

export function mapRequestToTrip(
  request: TravelerRequestSummary,
): TripCardModel {
  const trip: TripCardModel & {
    interests: string[];
    mode: TravelerRequestSummary["mode"];
    groupMax: number | null;
  } = {
    id: request.id,
    destination: request.destination,
    startsOn: request.starts_on,
    endsOn: request.ends_on,
    startTime: request.start_time ? request.start_time.slice(0, 5) : null,
    participantsCount: request.participants_count,
    budget:
      request.budget_minor == null
        ? null
        : { amount: request.budget_minor, currency: "RUB" },
    offerCount: request.offer_count,
    createdAt: request.created_at,
    interests: request.interests,
    mode: request.mode,
    groupMax: request.group_max,
    isOwnRequest: true,
    openToJoin: request.open_to_join ?? false,
    datesFlexible:
      request.date_flexibility != null && request.date_flexibility !== "exact",
    groupType: request.mode,
    guideName: null,
    guideAvatarUrl: null,
    organizerName: null,
    topOffersPhotos: request.guide_avatars.map((guide) => guide.avatar_url),
  };

  return trip;
}

export function mapBookingToTrip(
  booking: ConfirmedBookingSummary,
): TripCardModel {
  const bookingWithItinerary = booking as ConfirmedBookingSummary & {
    ends_on?: string | null;
    start_time?: string | null;
    participants_count?: number | null;
    route_stops?: { photoUrl: string; address?: string }[] | null;
    inclusions?: string[] | null;
  };

  return {
    id: booking.booking_id,
    destination: booking.destination,
    startsOn: booking.starts_on,
    endsOn: bookingWithItinerary.ends_on,
    startTime: bookingWithItinerary.start_time
      ? bookingWithItinerary.start_time.slice(0, 5)
      : null,
    participantsCount: bookingWithItinerary.participants_count,
    isOwnRequest: true,
    guideName: booking.guide_name,
    guideAvatarUrl: booking.guide_avatar_url,
    organizerName: null,
    routeStops: bookingWithItinerary.route_stops ?? undefined,
    inclusions: bookingWithItinerary.inclusions ?? undefined,
    price: {
      amount: booking.price_minor,
      currency: booking.currency,
    },
  };
}
