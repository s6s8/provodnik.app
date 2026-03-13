import type { ReviewRecord, ReviewsSummary } from "@/data/reviews/types";

function isoDaysAgo(daysAgo: number) {
  const value = new Date();
  value.setDate(value.getDate() - daysAgo);
  return value.toISOString();
}

const seededReviews: readonly ReviewRecord[] = [
  {
    id: "rev_seed_maria_1",
    createdAt: isoDaysAgo(36),
    author: { userId: "usr_traveler_irina", displayName: "Ирина" },
    target: { type: "guide", slug: "maria-rostov" },
    rating: 5,
    title: "Очень точный темп и маршрут",
    body: "Мария не пытается показать слишком много. Благодаря этому экскурсия получилась живой, а логистика была очень спокойной.",
    tags: ["темп", "логистика", "еда"],
  },
  {
    id: "rev_seed_maria_2",
    createdAt: isoDaysAgo(12),
    author: { userId: "usr_traveler_danylo", displayName: "Даниил" },
    target: { type: "guide", slug: "maria-rostov" },
    rating: 4,
    title: "Понравилось, поехал бы еще",
    body: "Маршрут по рынку отличный, а подсказки по времени реально помогли. На выходных хотелось бы еще одну более тихую остановку.",
    tags: ["контекст", "рынки"],
  },
  {
    id: "rev_seed_alexei_1",
    createdAt: isoDaysAgo(84),
    author: { userId: "usr_traveler_mina", displayName: "Мина" },
    target: { type: "guide", slug: "alexei-baikal" },
    rating: 5,
    title: "Безопасно и честно",
    body: "Алексей очень спокойно ведет группу, не обещает невозможного и всегда держит в голове запасной план по погоде.",
    tags: ["безопасность", "зима", "фото"],
  },
  {
    id: "rev_seed_listing_rostov_food_walk_1",
    createdAt: isoDaysAgo(9),
    author: { userId: "usr_traveler_you", displayName: "Вы" },
    target: { type: "listing", slug: "rostov-food-walk" },
    rating: 5,
    title: "Отлично для короткой поездки",
    body: "Маршрут легко читается, а программа выглядит продуманной. На выходных добавил бы еще одну спокойную точку.",
    tags: ["короткая поездка", "семья"],
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
