import type {
  ConfirmedBookingSummary,
  TravelerRequestSummary,
} from "@/lib/supabase/traveler-requests";

import {
  mapBookingToTrip,
  mapRequestToPhase,
  mapRequestToTrip,
} from "./trip-card-mappers";
import type { TripCardModel, TripPhase } from "./trip-card-types";

type GroupTripsByPhaseInput = {
  activeRequests: TravelerRequestSummary[];
  confirmedBookings: ConfirmedBookingSummary[];
};

function emptyGroups(): Record<TripPhase, TripCardModel[]> {
  return {
    today: [],
    upcoming: [],
    awaiting_decision: [],
    waiting_offers: [],
    completed: [],
  };
}

function todayDateKey(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function bookingPhase(startsOn: string): TripPhase {
  const startsOnDate = startsOn.slice(0, 10);
  const today = todayDateKey();

  if (startsOnDate === today) return "today";
  if (startsOnDate > today) return "upcoming";
  return "completed";
}

export function groupTripsByPhase({
  activeRequests,
  confirmedBookings,
}: GroupTripsByPhaseInput): Record<TripPhase, TripCardModel[]> {
  const groups = emptyGroups();

  for (const request of activeRequests) {
    groups[mapRequestToPhase(request)].push(mapRequestToTrip(request));
  }

  for (const booking of confirmedBookings) {
    groups[bookingPhase(booking.starts_on)].push(mapBookingToTrip(booking));
  }

  return groups;
}
