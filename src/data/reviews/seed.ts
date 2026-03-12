import type { ReviewsSummary, ReviewRecord } from "@/data/reviews/types";

function isoDaysAgo(daysAgo: number) {
  const value = new Date();
  value.setDate(value.getDate() - daysAgo);
  return value.toISOString();
}

const seededReviews: readonly ReviewRecord[] = [
  {
    id: "rev_seed_maria_1",
    createdAt: isoDaysAgo(36),
    author: { userId: "usr_traveler_irina", displayName: "Irina" },
    target: { type: "guide", slug: "maria-rostov" },
    rating: 5,
    title: "Compact route, great pacing",
    body: "Fewer stops but higher signal. Clear logistics and flexible backup plan when it started raining.",
    tags: ["pacing", "logistics", "food"],
  },
  {
    id: "rev_seed_maria_2",
    createdAt: isoDaysAgo(12),
    author: { userId: "usr_traveler_danylo", displayName: "Danylo" },
    target: { type: "guide", slug: "maria-rostov" },
    rating: 4,
    title: "Good context, would book again",
    body: "Loved the market route. A couple of stops were crowded, but the timing guidance helped a lot.",
    tags: ["context", "markets"],
  },
  {
    id: "rev_seed_alexei_1",
    createdAt: isoDaysAgo(84),
    author: { userId: "usr_traveler_mina", displayName: "Mina" },
    target: { type: "guide", slug: "alexei-baikal" },
    rating: 5,
    title: "Safety-first and honest",
    body: "Clear checkpoints, warm breaks, and realistic distances. Great for small-group winter travel.",
    tags: ["safety", "winter", "photography"],
  },
  {
    id: "rev_seed_listing_rostov_food_walk_1",
    createdAt: isoDaysAgo(9),
    author: { userId: "usr_traveler_you", displayName: "You" },
    target: { type: "listing", slug: "rostov-food-walk" },
    rating: 5,
    title: "Great for a short trip",
    body: "Easy to follow and the itinerary felt intentional. Would be even better with 1–2 quieter stops on weekends.",
    tags: ["short", "family"],
  },
] as const;

function clampTo2Decimals(value: number) {
  return Math.round(value * 100) / 100;
}

export function listSeededReviewsForTarget(
  type: ReviewRecord["target"]["type"],
  slug: string,
): ReviewRecord[] {
  return seededReviews
    .filter((item) => item.target.type === type && item.target.slug === slug)
    .map((item) => ({
      ...item,
      author: { ...item.author },
      target: { ...item.target },
      tags: item.tags ? [...item.tags] : undefined,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getSeededReviewsSummaryForTarget(
  type: ReviewRecord["target"]["type"],
  slug: string,
): ReviewsSummary {
  const items = seededReviews.filter(
    (item) => item.target.type === type && item.target.slug === slug,
  );

  if (items.length === 0) return { averageRating: 0, totalReviews: 0 };

  const total = items.reduce((sum, item) => sum + item.rating, 0);
  const lastReviewAt = items
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.createdAt;

  return {
    averageRating: clampTo2Decimals(total / items.length),
    totalReviews: items.length,
    lastReviewAt,
  };
}

