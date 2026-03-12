import type { ReviewRecord, ReviewsSummary } from "@/data/reviews/types";
import { getSeededReviewsSummaryForTarget, listSeededReviewsForTarget } from "@/data/reviews/seed";

const STORAGE_KEY = "provodnik.reviews.local.v1";

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function clampTo2Decimals(value: number) {
  return Math.round(value * 100) / 100;
}

export function listLocalReviews(): ReviewRecord[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParseJson<ReviewRecord[]>(window.localStorage.getItem(STORAGE_KEY));
  if (!parsed || !Array.isArray(parsed)) return [];
  return parsed;
}

export function saveLocalReviews(reviews: ReviewRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

export function addLocalReview(review: ReviewRecord) {
  const current = listLocalReviews();
  saveLocalReviews([review, ...current]);
}

export function listAllReviewsForTarget(
  type: ReviewRecord["target"]["type"],
  slug: string,
): ReviewRecord[] {
  const seeded = listSeededReviewsForTarget(type, slug);
  const local = listLocalReviews()
    .filter((item) => item.target.type === type && item.target.slug === slug)
    .map((item) => ({
      ...item,
      author: { ...item.author },
      target: { ...item.target },
      tags: item.tags ? [...item.tags] : undefined,
    }));

  const unique = new Map<string, ReviewRecord>();
  for (const item of [...local, ...seeded]) unique.set(item.id, item);

  return [...unique.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getAllReviewsSummaryForTarget(
  type: ReviewRecord["target"]["type"],
  slug: string,
): ReviewsSummary {
  const seeded = getSeededReviewsSummaryForTarget(type, slug);
  const local = listLocalReviews().filter(
    (item) => item.target.type === type && item.target.slug === slug,
  );

  if (local.length === 0) return seeded;

  const all = [...local, ...listSeededReviewsForTarget(type, slug)];
  if (all.length === 0) return { averageRating: 0, totalReviews: 0 };

  const total = all.reduce((sum, item) => sum + item.rating, 0);
  const lastReviewAt = all
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.createdAt;

  return {
    averageRating: clampTo2Decimals(total / all.length),
    totalReviews: all.length,
    lastReviewAt,
  };
}

