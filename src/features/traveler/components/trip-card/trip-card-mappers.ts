import type {
  ConfirmedBookingSummary,
  TravelerRequestSummary,
} from "@/lib/supabase/traveler-requests";

import type { TripCardModel, TripPhase } from "./trip-card-types";

export function mapRequestToPhase(
  request: TravelerRequestSummary,
): TripPhase {
  if (request.status === "open" && request.offer_count > 0) {
    return "awaiting_decision";
  }

  return "waiting_offers";
}

export function mapRequestToTrip(
  request: TravelerRequestSummary,
): TripCardModel {
  const requestWithFlexFlags = request as TravelerRequestSummary & {
    open_to_join?: boolean | null;
    date_locked?: boolean | null;
  };

  return {
    id: request.id,
    destination: request.destination,
    startsOn: request.starts_on,
    endsOn: request.ends_on,
    startTime: request.start_time,
    participantsCount: request.participants_count,
    budget:
      request.budget_minor == null
        ? null
        : { amount: request.budget_minor, currency: "RUB" },
    offerCount: request.offer_count,
    isOwnRequest: true,
    openToJoin: requestWithFlexFlags.open_to_join ?? false,
    datesFlexible: requestWithFlexFlags.date_locked === false,
    guideName: null,
    guideAvatarUrl: null,
    organizerName: null,
    topOffersPhotos: request.guide_avatars.map((guide) => guide.avatar_url),
  };
}

export function mapBookingToTrip(
  booking: ConfirmedBookingSummary,
): TripCardModel {
  return {
    id: booking.booking_id,
    destination: booking.destination,
    startsOn: booking.starts_on,
    isOwnRequest: true,
    guideName: booking.guide_name,
    guideAvatarUrl: booking.guide_avatar_url,
    organizerName: null,
    price: {
      amount: booking.price_minor,
      currency: booking.currency,
    },
  };
}
