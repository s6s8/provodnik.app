import type { GuideOfferDraft } from "@/data/guide-offer/schema";

export type GuideOfferLocalRecord = {
  id: string;
  requestId: string;
  createdAt: string;
  updatedAt: string;
  draft: GuideOfferDraft;
};

const STORAGE_KEY = "provodnik.guide.offers.v1";

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

  return `offer_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function getLocalGuideOffers(): GuideOfferLocalRecord[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParseJson<GuideOfferLocalRecord[]>(
    window.localStorage.getItem(STORAGE_KEY),
  );
  if (!parsed || !Array.isArray(parsed)) return [];
  return parsed;
}

export function saveLocalGuideOffers(records: GuideOfferLocalRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function listLocalGuideOffersForRequest(requestId: string) {
  return getLocalGuideOffers()
    .filter((record) => record.requestId === requestId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function upsertLocalGuideOffer(
  requestId: string,
  draft: GuideOfferDraft,
  existingId?: string,
): GuideOfferLocalRecord {
  const now = new Date().toISOString();
  const current = getLocalGuideOffers();
  const id = existingId ?? getUuid();
  const next: GuideOfferLocalRecord = {
    id,
    requestId,
    createdAt: current.find((item) => item.id === id)?.createdAt ?? now,
    updatedAt: now,
    draft,
  };

  const merged = [next, ...current.filter((item) => item.id !== id)];
  saveLocalGuideOffers(merged);
  return next;
}

