import {
  getSeededOpenRequestById,
  listSeededRosterForOpenRequest,
} from "@/data/open-requests/seed";
import { seededTravelerOffers } from "@/data/traveler-request/seed";

export function getSeededPublicRequestDetail(requestId: string) {
  const request = getSeededOpenRequestById(requestId);
  if (!request) return null;

  const roster = listSeededRosterForOpenRequest(request.id);
  const offers = seededTravelerOffers.filter(
    (offer) => offer.requestId === request.travelerRequestId,
  );

  return { request, roster, offers };
}

