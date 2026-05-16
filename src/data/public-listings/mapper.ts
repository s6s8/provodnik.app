import { THEMES, type ThemeSlug } from "@/data/themes";

// Derived from the canon (not a hand-copied list) so it can never drift from
// themes.ts again — that drift is exactly what put `photo` here instead of
// `religion` (ERR-091).
const THEME_SLUGS: readonly ThemeSlug[] = THEMES.map((t) => t.slug);

/** DB `listings.category` and legacy display strings -> canonical `ThemeSlug`. */
const LEGACY_CATEGORY_TO_SLUG: Record<string, ThemeSlug> = {
  История: "history",
  Природа: "nature",
  Гастрономия: "food",
  Еда: "food",
  "С семьей": "kids",
  "С семьёй": "kids",
  Архитектура: "architecture",
  Искусство: "art",
  Необычное: "unusual",
  Религия: "religion",
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
