import { seededGuideBookings } from "@/data/guide-booking/seed";
import type {
  GuideBookingRecord,
  GuideBookingStatus,
} from "@/data/guide-booking/types";

const STORAGE_KEY = "provodnik.guide.bookings.v1";

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function getLocalGuideBookings(): GuideBookingRecord[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParseJson<GuideBookingRecord[]>(
    window.localStorage.getItem(STORAGE_KEY)
  );
  if (!parsed || !Array.isArray(parsed)) return [];
  return parsed;
}

export function saveLocalGuideBookings(bookings: GuideBookingRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

export function listGuideBookings(): GuideBookingRecord[] {
  const local = getLocalGuideBookings();
  const merged = [...local, ...seededGuideBookings];

  const unique = new Map<string, GuideBookingRecord>();
  for (const item of merged) unique.set(item.id, item);

  return [...unique.values()].sort((a, b) => {
    const aTime = Date.parse(a.updatedAt || a.createdAt);
    const bTime = Date.parse(b.updatedAt || b.createdAt);
    return bTime - aTime;
  });
}

export function getGuideBookingById(id: string): GuideBookingRecord | null {
  const local = getLocalGuideBookings().find((item) => item.id === id);
  if (local) return local;
  return seededGuideBookings.find((item) => item.id === id) ?? null;
}

export function updateGuideBookingStatus(
  bookingId: string,
  nextStatus: GuideBookingStatus
): GuideBookingRecord | null {
  if (typeof window === "undefined") return null;

  const existing = getGuideBookingById(bookingId);
  if (!existing) return null;

  const now = new Date().toISOString();
  const next: GuideBookingRecord = { ...existing, status: nextStatus, updatedAt: now };

  const local = getLocalGuideBookings();
  const index = local.findIndex((item) => item.id === bookingId);
  const nextLocal = [...local];

  if (index === -1) nextLocal.unshift(next);
  else nextLocal[index] = next;

  saveLocalGuideBookings(nextLocal);
  return next;
}

