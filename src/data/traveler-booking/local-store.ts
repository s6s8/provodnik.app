import {
  seededTravelerBookingTimeline,
  seededTravelerBookings,
} from "@/data/traveler-booking/seed";
import type {
  TravelerBookingRecord,
  TravelerBookingTimelineStep,
} from "@/data/traveler-booking/types";

const STORAGE_KEY = "provodnik.traveler.bookings.v1";

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function getLocalTravelerBookings(): TravelerBookingRecord[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParseJson<TravelerBookingRecord[]>(
    window.localStorage.getItem(STORAGE_KEY),
  );
  if (!parsed || !Array.isArray(parsed)) return [];
  return parsed;
}

export function saveLocalTravelerBookings(bookings: TravelerBookingRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

export function listTravelerBookings(): TravelerBookingRecord[] {
  const local = getLocalTravelerBookings();
  const merged = [...local, ...seededTravelerBookings];

  const unique = new Map<string, TravelerBookingRecord>();
  for (const item of merged) unique.set(item.id, item);

  return [...unique.values()].sort((a, b) => {
    const aTime = Date.parse(a.updatedAt || a.createdAt);
    const bTime = Date.parse(b.updatedAt || b.createdAt);
    return bTime - aTime;
  });
}

export function getTravelerBookingById(id: string): TravelerBookingRecord | null {
  const local = getLocalTravelerBookings().find((item) => item.id === id);
  if (local) return local;
  return seededTravelerBookings.find((item) => item.id === id) ?? null;
}

export function listTimelineForTravelerBooking(
  bookingId: string,
): TravelerBookingTimelineStep[] {
  const steps = seededTravelerBookingTimeline
    .filter((item) => item.bookingId === bookingId)
    .slice();

  return steps;
}

