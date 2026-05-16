import type { ThemeSlug } from "@/data/themes";

const THEME_SLUGS: readonly ThemeSlug[] = [
  "history",
  "architecture",
  "nature",
  "food",
  "art",
  "photo",
  "kids",
  "unusual",
];

/** DB `listings.category` and legacy display strings → canonical `ThemeSlug`. */
const LEGACY_CATEGORY_TO_SLUG: Record<string, ThemeSlug> = {
  История: "history",
  Природа: "nature",
  Гастрономия: "food",
  Еда: "food",
  Фотография: "photo",
  "С семьей": "kids",
  "С семьёй": "kids",
  Архитектура: "architecture",
  Искусство: "art",
  Необычное: "unusual",
  Фотопрогулки: "photo",
  "Для детей": "kids",
};

export function mapDbCategoryToThemeSlug(raw: string): ThemeSlug | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if ((THEME_SLUGS as readonly string[]).includes(trimmed)) {
    return trimmed as ThemeSlug;
  }
  const mapped = LEGACY_CATEGORY_TO_SLUG[trimmed];
  return mapped ?? null;
}
