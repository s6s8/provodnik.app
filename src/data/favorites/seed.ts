import type { FavoriteRecord } from "@/data/favorites/types";

function isoDaysAgo(daysAgo: number) {
  const value = new Date();
  value.setDate(value.getDate() - daysAgo);
  return value.toISOString();
}

const seededFavorites: readonly FavoriteRecord[] = [
  {
    id: "fav_seed_you_maria",
    userId: "usr_traveler_you",
    createdAt: isoDaysAgo(11),
    target: { type: "guide", slug: "maria-rostov" },
  },
  {
    id: "fav_seed_you_alexei",
    userId: "usr_traveler_you",
    createdAt: isoDaysAgo(3),
    target: { type: "guide", slug: "alexei-baikal" },
  },
  {
    id: "fav_seed_you_rostov_food_walk",
    userId: "usr_traveler_you",
    createdAt: isoDaysAgo(2),
    target: { type: "listing", slug: "rostov-food-walk" },
  },
  {
    id: "fav_seed_irina_baikal_ice",
    userId: "usr_traveler_irina",
    createdAt: isoDaysAgo(6),
    target: { type: "listing", slug: "baikal-ice-safety-day" },
  },
] as const;

export function listSeededFavoritesForUser(userId: string): FavoriteRecord[] {
  return seededFavorites
    .filter((item) => item.userId === userId)
    .map((item) => ({
      ...item,
      target: { ...item.target },
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function isSeededFavorite(
  userId: string,
  type: FavoriteRecord["target"]["type"],
  slug: string,
): boolean {
  return seededFavorites.some(
    (item) =>
      item.userId === userId &&
      item.target.type === type &&
      item.target.slug === slug,
  );
}

