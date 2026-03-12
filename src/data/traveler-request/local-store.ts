import type { TravelerRequest } from "@/data/traveler-request/schema";
import {
  seededTravelerOffers,
  seededTravelerRequests,
  seededTravelerTimeline,
} from "@/data/traveler-request/seed";
import type {
  TravelerOffer,
  TravelerRequestRecord,
  TravelerRequestTimelineEvent,
  TravelerRequestStatus,
} from "@/data/traveler-request/types";

const STORAGE_KEY = "provodnik.traveler.requests.v1";

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function getUuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `req_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function createTravelerRequestRecord(
  request: TravelerRequest,
  status: TravelerRequestStatus = "submitted",
): TravelerRequestRecord {
  const now = new Date().toISOString();
  return {
    id: getUuid(),
    status,
    createdAt: now,
    updatedAt: now,
    request,
  };
}

export function getLocalTravelerRequests(): TravelerRequestRecord[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParseJson<TravelerRequestRecord[]>(
    window.localStorage.getItem(STORAGE_KEY),
  );
  if (!parsed || !Array.isArray(parsed)) return [];
  return parsed;
}

export function saveLocalTravelerRequests(requests: TravelerRequestRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

export function addLocalTravelerRequest(record: TravelerRequestRecord) {
  const current = getLocalTravelerRequests();
  saveLocalTravelerRequests([record, ...current]);
}

export function listTravelerRequests(): TravelerRequestRecord[] {
  const local = getLocalTravelerRequests();
  const merged = [...local, ...seededTravelerRequests];

  const unique = new Map<string, TravelerRequestRecord>();
  for (const item of merged) unique.set(item.id, item);

  return [...unique.values()].sort((a, b) => {
    const aTime = Date.parse(a.updatedAt || a.createdAt);
    const bTime = Date.parse(b.updatedAt || b.createdAt);
    return bTime - aTime;
  });
}

export function getTravelerRequestById(
  id: string,
): TravelerRequestRecord | null {
  const local = getLocalTravelerRequests().find((item) => item.id === id);
  if (local) return local;
  return seededTravelerRequests.find((item) => item.id === id) ?? null;
}

export function listOffersForTravelerRequest(requestId: string): TravelerOffer[] {
  return seededTravelerOffers
    .filter((offer) => offer.requestId === requestId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function listTimelineForTravelerRequest(
  requestId: string,
): TravelerRequestTimelineEvent[] {
  const events = seededTravelerTimeline
    .filter((event) => event.requestId === requestId)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

  if (events.length > 0) return events;

  const request = getTravelerRequestById(requestId);
  if (!request) return [];

  return [
    {
      id: `tl_${requestId}_created`,
      requestId,
      at: request.createdAt,
      title: "Request created",
      description:
        "This request is stored locally in MVP baseline. Offers are seeded for demo purposes.",
    },
  ];
}

