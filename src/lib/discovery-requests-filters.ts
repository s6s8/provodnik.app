import { THEMES, type ThemeSlug, isThemeSlug } from "@/data/themes";

export const REQUESTS_WHEN_PRESETS = [
  "this-week",
  "this-month",
  "next-month",
  "flexible",
] as const;

export type RequestsWhenPreset = (typeof REQUESTS_WHEN_PRESETS)[number];

export type RequestsMarketplaceFilterState = {
  q: string;
  city: string | null;
  when: RequestsWhenPreset | null;
  from: string | null;
  to: string | null;
  themeSlugs: ThemeSlug[];
};

const THEME_LABEL_BY_SLUG = Object.fromEntries(
  THEMES.map((theme) => [theme.slug, theme.label] as const),
) as Record<ThemeSlug, string>;

const THEME_SLUG_BY_LABEL = Object.fromEntries(
  THEMES.map((theme) => [theme.label, theme.slug] as const),
) as Record<string, ThemeSlug>;

export function themeLabelFromSlug(slug: ThemeSlug): string {
  return THEME_LABEL_BY_SLUG[slug];
}

export function themeSlugFromLabel(label: string): ThemeSlug | null {
  return THEME_SLUG_BY_LABEL[label] ?? null;
}

function isWhenPreset(value: string): value is RequestsWhenPreset {
  return (REQUESTS_WHEN_PRESETS as readonly string[]).includes(value);
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function parseRequestsMarketplaceFilters(
  params: URLSearchParams,
): RequestsMarketplaceFilterState {
  const q = (params.get("q") ?? "").trim();
  const cityRaw = (params.get("city") ?? "").trim();
  const whenRaw = (params.get("when") ?? "").trim();
  const fromRaw = (params.get("from") ?? "").trim();
  const toRaw = (params.get("to") ?? "").trim();
  const themeRaw = (params.get("theme") ?? "").trim();

  const themeSlugs = themeRaw
    .split(",")
    .map((part) => part.trim())
    .filter((part): part is ThemeSlug => isThemeSlug(part));

  return {
    q,
    city: cityRaw.length > 0 ? cityRaw : null,
    when: whenRaw && isWhenPreset(whenRaw) ? whenRaw : null,
    from: fromRaw && isIsoDate(fromRaw) ? fromRaw : null,
    to: toRaw && isIsoDate(toRaw) ? toRaw : null,
    themeSlugs,
  };
}

export function buildRequestsMarketplacePath(state: RequestsMarketplaceFilterState): string {
  const params = new URLSearchParams();

  const trimmedQ = state.q.trim();
  if (trimmedQ) params.set("q", trimmedQ);
  if (state.city) params.set("city", state.city);
  if (state.when) params.set("when", state.when);
  if (state.from) params.set("from", state.from);
  if (state.to) params.set("to", state.to);
  if (state.themeSlugs.length > 0) params.set("theme", state.themeSlugs.join(","));

  const query = params.toString();
  return query ? `/requests?${query}` : "/requests";
}
