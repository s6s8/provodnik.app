import { THEMES, type ThemeSlug } from "./themes";

const interestSlugLabels = THEMES.map(({ slug, label }) => ({ slug, label })) satisfies ReadonlyArray<{
  slug: ThemeSlug;
  label: string;
}>;

export const INTEREST_CHIPS = interestSlugLabels.map(({ slug, label }) => ({
  id: slug,
  label,
})) satisfies ReadonlyArray<{ id: ThemeSlug; label: string }>;
