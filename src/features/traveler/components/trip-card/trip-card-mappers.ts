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
  return {
    id: request.id,
    destination: request.destination,
    startsOn: request.starts_on,
    isOwnRequest: true,
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
