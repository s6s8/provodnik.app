import type {
  ConfirmedBookingSummary,
  JoinedGroupSummary,
  TravelerRequestSummary,
} from "@/lib/supabase/traveler-requests";
import { todayMoscowISODate } from "@/lib/dates";

import {
  mapBookingToTrip,
  mapRequestToPhase,
  mapRequestToTrip,
} from "./trip-card-mappers";
import type { TripCardModel, TripPhase } from "./trip-card-types";

type GroupTripsByPhaseInput = {
  activeRequests: TravelerRequestSummary[];
  confirmedBookings: ConfirmedBookingSummary[];
  joinedGroups?: JoinedGroupSummary[];
  terminalRequests?: TravelerRequestSummary[];
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

function bookingPhase(startsOn: string): TripPhase {
  const startsOnDate = startsOn.slice(0, 10);
  const today = todayMoscowISODate();

  if (!startsOnDate) return "upcoming";
  if (startsOnDate === today) return "today";
  if (startsOnDate > today) return "upcoming";
  return "completed";
}

function resolveBookingPhase(booking: ConfirmedBookingSummary): TripPhase {
  if (booking.status === "completed" || booking.status === "cancelled") {
    return "completed";
  }

  return bookingPhase(booking.starts_on);
}

function mapJoinedGroupToTrip(group: JoinedGroupSummary): TripCardModel {
  return {
    id: group.id,
    kind: "request",
    destination: group.destination,
    startsOn: group.starts_on,
    endsOn: group.ends_on,
    startTime: group.start_time,
    participantsCount: group.participants_count,
    budget:
      group.budget_minor == null
        ? null
        : { amount: group.budget_minor, currency: "RUB" },
    isOwnRequest: false,
    guideName: null,
    guideAvatarUrl: null,
    organizerName: group.owner_name,
    openToJoin: true,
    groupType: "assembly",
  };
}

function sortPhaseTrips(
  phase: TripPhase,
  trips: TripCardModel[],
): TripCardModel[] {
  const sorted = [...trips].sort((a, b) => a.startsOn.localeCompare(b.startsOn));

  if (phase === "completed") {
    return sorted.reverse();
  }

  return sorted;
}

export function groupTripsByPhase({
  activeRequests,
  confirmedBookings,
  joinedGroups = [],
  terminalRequests = [],
}: GroupTripsByPhaseInput): Record<TripPhase, TripCardModel[]> {
  const groups = emptyGroups();
  const bookedRequestIds = new Set(
    confirmedBookings
      .map((booking) => booking.request_id)
      .filter((requestId): requestId is string => Boolean(requestId)),
  );

  for (const request of activeRequests) {
    groups[mapRequestToPhase(request)].push(mapRequestToTrip(request));
  }

  for (const booking of confirmedBookings) {
    groups[resolveBookingPhase(booking)].push(mapBookingToTrip(booking));
  }

  for (const group of joinedGroups) {
    if (bookedRequestIds.has(group.id)) continue;
    groups[bookingPhase(group.starts_on)].push(mapJoinedGroupToTrip(group));
  }

  for (const request of terminalRequests) {
    groups.completed.push(mapRequestToTrip(request));
  }

  for (const phase of Object.keys(groups) as TripPhase[]) {
    groups[phase] = sortPhaseTrips(phase, groups[phase]);
  }

  return groups;
}
