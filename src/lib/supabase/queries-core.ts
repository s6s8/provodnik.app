import type { SupabaseClient } from "@supabase/supabase-js";

import { formatRubNumber, kopecksToRub } from "@/data/money";
import { THEMES, type ThemeSlug } from "@/data/themes";
import { brandGradient } from "@/lib/city-image";
import { formatRussianDateRange } from "@/lib/dates";
import { resolveDisplayName } from "@/lib/profile/resolve-display-name";
import { sanitizeTravelerRequestDestinationLabel } from "@/lib/traveler-request-destination";

export type QueryResult<T> = { data: T | null; error: Error | null };
export type DestinationCategory = "city" | "nature" | "culture";

export type DestinationRecord = {
  id: string;
  slug: string;
  name: string;
  region: string;
  category: DestinationCategory;
  description: string;
  heroImageUrl: string;
  listingCount: number;
  guidesCount: number;
  avgRating: number | null;
};

export type ListingRecord = {
  id: string;
  slug: string;
  title: string;
  destinationSlug: string;
  destinationName: string;
  destinationRegion: string;
  imageUrl: string;
  priceRub: number;
  durationDays: number;
  durationLabel: string;
  groupSize: number;
  difficulty: string;
  departure: string;
  format: string;
  description: string;
  inclusions: string[];
  exclusions: string[];
  guideSlug: string;
  guideName: string;
  guideAvatarUrl?: string;
  guideHomeBase: string;
  rating: number;
  reviewCount: number;
  status: "active" | "draft";
};

export type GuideRecord = {
  id: string;
  slug: string;
  fullName: string;
  avatarUrl?: string;
  initials: string;
  homeBase: string;
  bio: string;
  destinations: string[];
  destinationSlugs: string[];
  rating: number;
  reviewCount: number;
  topListingTitle?: string;
  experienceYears: number;
  listingCount?: number;
  isPartialMatch: boolean;
  specialties: string[];
  /** Canonical theme slugs from guide_profiles.specializations. */
  specializations: string[];
  /** Base city from guide_profiles.base_city (detail RPC only). */
  baseCity: string | null;
  tripsCompleted: number;
  recommendPct: number | null;
  responseRate?: number | null;
  verified: boolean;
  languages: string[];
};

export type PlatformStats = {
  guidesActive: number;
  listingsTotal: number;
  tripsTotal: number;
};

export type RequestMember = {
  id: string;
  displayName: string;
  initials: string;
  avatarUrl?: string;
};

export type RequestRecord = {
  id: string;
  /** Request owner (traveler_id); null/absent when read via the sanitized public view. */
  travelerId?: string | null;
  destination: string;
  destinationSlug: string;
  destinationRegion: string;
  title: string;
  dateLabel: string;
  startsOn?: string | null;
  endsOn?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  date_locked?: boolean;
  time_locked?: boolean;
  groupSize: number;
  capacity: number | null;
  budgetRub: number;
  budgetLabel: string;
  requesterName: string;
  requesterAvatarUrl?: string | null;
  requesterInitials: string;
  description: string;
  interests: string[];
  mode: "private" | "assembly";
  format: string;
  status: "open" | "booked" | "cancelled" | "expired";
  createdAt: string;
  offerCount: number;
  imageUrl: string;
  members: RequestMember[];
  dateFlexibility?: 'exact' | 'few_days';
};

export type BookingRecord = {
  id: string;
  title: string;
  destination: string;
  dateLabel: string;
  priceRub: number;
  guideName?: string;
  travelerName?: string;
  travelerPhone?: string | null;
  status: string;
};

export type FavoriteRecord = {
  id: string;
  listingSlug: string;
  createdAt: string;
};

export type ReviewRecord = {
  id: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
};

export type ListingFilters = { destination?: string; duration?: string; priceRange?: string; format?: string };
export type RequestFilters = { destination?: string; status?: string };
export type GuideFilters = { destination?: string; specializations?: string[]; q?: string };

export type DestinationOption = {
  name: string;
  region: string;
  guideCount: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const fallbackHeroImage = brandGradient("listing");

export function makeError(error: unknown): Error {
  if (error instanceof Error) return error;
  // supabase-js / PostgREST reject with a plain object ({message, details,
  // hint, code}), not an Error instance — the old `instanceof` check threw all
  // of that away and logged "Unknown Supabase error" (row #40). Preserve the
  // real message and carry the PG code on `.name` so logs are actionable.
  if (error && typeof error === "object" && "message" in error) {
    const e = error as { message?: unknown; code?: unknown };
    const err = new Error(String(e.message ?? "Unknown Supabase error"));
    if (e.code != null) err.name = String(e.code);
    return err;
  }
  return new Error("Unknown Supabase error");
}

export function normalizeSlug(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-");
}

export function destinationSearchFromSlug(value: string) {
  return value.trim().toLowerCase().replace(/-/g, " ");
}

export function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function titleToCategory(title: string): DestinationCategory {
  const lower = title.toLowerCase();
  if (lower.includes("байкал") || lower.includes("алтай") || lower.includes("мурман")) return "nature";
  if (lower.includes("суздал") || lower.includes("казан") || lower.includes("калининг")) return "culture";
  return "city";
}

export function formatRub(value: number) {
  return `${formatRubNumber(value)} ₽`;
}

export function formatDateLabel(start: string, end?: string | null) {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString("ru-RU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  };
  const s = fmt(start);
  if (!end || end === start) return s;
  return `${s} – ${fmt(end)}`;
}

export function daysLabel(days: number): string {
  if (days === 1) return "1 день";
  if (days >= 2 && days <= 4) return `${days} дня`;
  return `${days} дней`;
}

export function parseImageFromJson(jsonText: string | null | undefined): string {
  if (!jsonText) return fallbackHeroImage;
  try {
    const parsed = JSON.parse(jsonText);
    return parsed?.imageUrl ?? fallbackHeroImage;
  } catch {
    return fallbackHeroImage;
  }
}

export function applyListingFilters(listings: ListingRecord[], filters?: ListingFilters) {
  if (!filters) return listings;
  return listings.filter((listing) => {
    if (filters.destination && !listing.destinationName.toLowerCase().includes(filters.destination.toLowerCase())) return false;
    if (filters.format && !listing.format.toLowerCase().includes(filters.format.toLowerCase())) return false;
    return true;
  });
}

export function applyRequestFilters(requests: RequestRecord[], filters?: RequestFilters) {
  if (!filters) return requests;
  return requests.filter((request) => {
    if (filters.destination && !request.destination.toLowerCase().includes(filters.destination.toLowerCase())) return false;
    if (filters.status && request.status !== filters.status) return false;
    return true;
  });
}

/** Seed/QA guide accounts use a "qa-" slug prefix and must stay out of public catalogs. */
export const QA_GUIDE_SLUG_PREFIX = "qa-";

export function isQaGuideSlug(slug: string | null | undefined): boolean {
  return Boolean(slug && slug.toLowerCase().startsWith(QA_GUIDE_SLUG_PREFIX));
}

export function applyGuideFilters(guides: GuideRecord[], filters?: GuideFilters) {
  const visible = guides.filter((guide) => !isQaGuideSlug(guide.slug));
  if (!filters?.destination) return visible;
  return visible.filter((guide) =>
    guide.destinations.some((d) => d.toLowerCase().includes(filters.destination!.toLowerCase())),
  );
}

/**
 * profiles.full_name is null for guide accounts — guides set their public name on
 * guide_profiles.display_name (the anon-readable source). Enrich raw listing rows
 * with that name so cards and detail pages show the real guide ("Гиляна Очирова")
 * instead of the "Локальный гид" role fallback. Mutates and returns the rows.
 */
export async function attachGuideDisplayNames(
  client: SupabaseClient,
  rows: Array<Record<string, unknown>>,
): Promise<Array<Record<string, unknown>>> {
  const guideIds = [...new Set(rows.map((r) => r.guide_id as string).filter(Boolean))];
  if (guideIds.length === 0) return rows;

  const { data } = await client
    .from("guide_profiles")
    .select("user_id, display_name")
    .in("user_id", guideIds);

  const nameById = new Map(
    (data ?? []).map((g) => [g.user_id as string, g.display_name as string | null]),
  );

  for (const row of rows) {
    const display = nameById.get(row.guide_id as string);
    if (!display) continue;
    const existing =
      (row.profiles as { full_name?: string | null; avatar_url?: string | null } | null) ?? null;
    row.profiles = {
      full_name: existing?.full_name ?? display,
      avatar_url: existing?.avatar_url ?? null,
    };
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Row mappers (match actual DB schema)
// ---------------------------------------------------------------------------

export function mapListingRow(row: Record<string, unknown>): ListingRecord {
  const priceMinor = (row.price_from_minor as number) ?? 0;
  const durationMin = (row.duration_minutes as number) ?? 480;
  const days = Math.max(1, Math.round(durationMin / 480));
  const city = (row.city as string) ?? "";
  const region = (row.region as string) ?? "";
  const imageUrl =
    (row.image_url as string | null) ??
    parseImageFromJson(row.description as string | null | undefined);
  const profile =
    (row.profiles as { full_name?: string | null; avatar_url?: string | null } | null) ?? null;

  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    destinationSlug: normalizeSlug(city || region),
    destinationName: city || region,
    destinationRegion: region,
    imageUrl,
    priceRub: Math.round(priceMinor / 100),
    durationDays: days,
    durationLabel: daysLabel(days),
    groupSize: (row.max_group_size as number) ?? 6,
    difficulty: ((row.category as string) ?? "").toLowerCase().includes("природ") ? "Средняя" : "Лёгкая",
    departure: (row.meeting_point as string) ?? city,
    format: (row.category as string) ?? "Авторский маршрут",
    description: (row.route_summary as string) ?? "",
    inclusions: (row.inclusions as string[]) ?? [],
    exclusions: (row.exclusions as string[]) ?? [],
    guideSlug: normalizeSlug((row.guide_id as string) ?? ""),
    guideName: profile?.full_name ?? "Локальный гид",
    guideAvatarUrl: profile?.avatar_url ?? undefined,
    guideHomeBase: city || region,
    rating: typeof row.average_rating === "number" ? row.average_rating : 0,
    reviewCount: typeof row.review_count === "number" ? row.review_count : 0,
    status: "active",
  };
}

export function parseNotesJson(notes: string | null | undefined): Record<string, unknown> {
  if (!notes) return {};
  try {
    const parsed = JSON.parse(notes) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

export function getNotesPlainText(notes: string | null | undefined): string | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return null;
    return notes;
  } catch {
    return notes;
  }
}

export function formatCategory(cat: string): string {
  switch (cat) {
    case "city": return "Городская экскурсия";
    case "nature": return "Природный маршрут";
    case "culture": return "Культурный маршрут";
    case "food": return "Гастрономический тур";
    case "adventure": return "Активный отдых";
    case "relax": return "Отдых";
    default: return cat;
  }
}

export function formatRequestPreference(value: string): string {
  switch (value) {
    case "group": return "Сборная";
    case "private": return "Своя";
    default: return value;
  }
}

export function mapRequestMode(
  formatPreference: string | null | undefined,
  openToJoin: boolean | null | undefined,
): RequestRecord["mode"] {
  switch (formatPreference) {
    case "group": return "assembly";
    case "private": return "private";
    default: return openToJoin === true ? "assembly" : "private";
  }
}

export const VALID_INTEREST_SLUGS = THEMES.map((t) => t.slug) satisfies readonly ThemeSlug[];

/**
 * Reveal a traveler's real name on guide-side booking-detail surfaces only.
 * Inbox lists and pre-confirmation booking states stay anonymous.
 */
export function revealTravelerName(
  name: string | null | undefined,
  bookingStatus: string | null | undefined,
): string {
  const trimmed = name?.trim();
  return (bookingStatus === "confirmed" || bookingStatus === "completed") && trimmed
    ? trimmed
    : "Путешественник";
}

export function revealTravelerPhone(
  phone: string | null | undefined,
  bookingStatus: string | null | undefined,
): string | null {
  const trimmed = phone?.trim();
  return (bookingStatus === "confirmed" || bookingStatus === "completed") && trimmed ? trimmed : null;
}

export function mapRequestRow(
  row: Record<string, unknown>,
  requesterName = "Путешественник",
  requesterInitials = "П",
  requesterAvatarUrl: string | null = null,
): RequestRecord {
  const dest = sanitizeTravelerRequestDestinationLabel(row.destination);
  const rawBudget = row.budget_minor as number | null | undefined;
  const budgetMinor = rawBudget ?? 0;
  const budgetRub = kopecksToRub(budgetMinor);
  const budgetLabel =
    rawBudget == null || rawBudget === 0
      ? "не указан"
      : `${formatRub(budgetRub)} / чел.`;
  const meta = parseNotesJson(row.notes as string);
  const imageUrl = (meta.imageUrl as string) ?? fallbackHeroImage;
  const destinationLabel = sanitizeTravelerRequestDestinationLabel(
    (meta.destinationLabel as string | undefined) ?? dest,
  );
  const formatPreference = row.format_preference as string | null | undefined;

  return {
    id: row.id as string,
    travelerId: (row.traveler_id as string | null) ?? null,
    destination: destinationLabel,
    destinationSlug: normalizeSlug(dest),
    destinationRegion: (meta.regionLabel as string) ?? (row.region as string) ?? "Россия",
    title: destinationLabel,
    dateLabel: (meta.dateRangeLabel as string | null) ?? formatRussianDateRange(
      (row.starts_on as string) ?? "",
      (row.ends_on as string | null) ?? null,
    ),
    startsOn: (row.starts_on as string | null) ?? null,
    endsOn: (row.ends_on as string | null) ?? null,
    startTime: row.start_time ? (row.start_time as string).slice(0, 5) : null,
    endTime: row.end_time ? (row.end_time as string).slice(0, 5) : null,
    date_locked: (row.date_locked as boolean | null) ?? undefined,
    time_locked: (row.time_locked as boolean | null) ?? undefined,
    groupSize: (row.participants_count as number) ?? 1,
    capacity: (row.group_capacity as number | null) ?? null,
    budgetRub,
    budgetLabel,
    requesterName,
    requesterAvatarUrl,
    requesterInitials,
    description:
      (meta.description as string | null) ??
      getNotesPlainText(row.notes as string | null) ??
      (row.description as string | null) ??
      "",
    interests: Array.isArray(row.interests)
      ? (row.interests as string[]).filter((s) => (VALID_INTEREST_SLUGS as readonly string[]).includes(s))
      : [],
    mode: mapRequestMode(formatPreference, row.open_to_join as boolean | null | undefined),
    format: formatRequestPreference(formatPreference ?? ""),
    status: (row.status as RequestRecord["status"]) ?? "open",
    createdAt: (row.created_at as string) ?? "",
    offerCount: 0,
    imageUrl,
    members: [],
    dateFlexibility: (row.date_flexibility as 'exact' | 'few_days') ?? 'exact',
  };
}

export async function fetchMembersForRequests(
  db: SupabaseClient,
  requests: Array<{ id: string; creatorId: string }>,
): Promise<Map<string, RequestMember[]>> {
  const map = new Map<string, RequestMember[]>();
  if (requests.length === 0) return map;

  const requestIds = requests.map((r) => r.id);
  const creatorIds = [...new Set(requests.map((r) => r.creatorId))];

  const [{ data: memberRows, error: memberError }, { data: creatorRows, error: creatorError }] =
    await Promise.all([
      db
        .from("open_request_members")
        .select("request_id, traveler_id, profiles:traveler_id(full_name, avatar_url)")
        .in("request_id", requestIds)
        .eq("status", "joined"),
      db.from("profiles").select("id, full_name, avatar_url").in("id", creatorIds),
    ]);

  if (memberError) throw memberError;
  if (creatorError) throw creatorError;

  const creatorProfiles = new Map<string, { name: string | null; avatarUrl: string | null }>();
  for (const cp of creatorRows ?? []) {
    creatorProfiles.set(cp.id as string, {
      name: cp.full_name as string | null,
      avatarUrl: cp.avatar_url as string | null,
    });
  }

  for (const req of requests) {
    const cp = creatorProfiles.get(req.creatorId);
    const displayName = cp?.name ?? "Путешественник";
    map.set(req.id, [
      { id: req.creatorId, displayName, initials: getInitials(displayName), avatarUrl: cp?.avatarUrl ?? undefined },
    ]);
  }

  for (const row of memberRows ?? []) {
    const reqId = row.request_id as string;
    const travelerId = row.traveler_id as string;
    const req = requests.find((r) => r.id === reqId);
    if (req?.creatorId === travelerId) continue;

    const profileRaw = (row as Record<string, unknown>).profiles;
    const profile = Array.isArray(profileRaw)
      ? (profileRaw[0] as Record<string, unknown> | undefined)
      : (profileRaw as Record<string, unknown> | null);

    const displayName = (profile?.full_name as string | null) ?? "Участник";
    const list = map.get(reqId) ?? [];
    list.push({
      id: travelerId,
      displayName,
      initials: getInitials(displayName),
      avatarUrl: (profile?.avatar_url as string | null) ?? undefined,
    });
    map.set(reqId, list);
  }

  return map;
}

export function mapGuideRow(gp: Record<string, unknown>, profile: Record<string, unknown> | null): GuideRecord {
  const fullName = resolveDisplayName("guide", {
    full_name: (profile?.full_name as string | null | undefined) ?? (gp.display_name as string | null | undefined),
  });
  const regions = (gp.regions as string[]) ?? [];
  const baseCity = (gp.base_city as string | null) ?? null;
  const region = regions[0];
  return {
    id: gp.user_id as string,
    slug: (gp.slug as string) ?? normalizeSlug(fullName),
    fullName,
    avatarUrl: (profile?.avatar_url as string) ?? undefined,
    initials: getInitials(fullName),
    homeBase:
      baseCity && region && baseCity !== region
        ? `${region}, ${baseCity}`
        : baseCity ?? region ?? "Россия",
    bio: (gp.bio as string) ?? "Проводник по локальным маршрутам.",
    destinations: regions,
    destinationSlugs: regions.map(normalizeSlug),
    rating: 0,
    reviewCount: 0,
    topListingTitle: undefined,
    experienceYears: (gp.years_experience as number) ?? 5,
    isPartialMatch: (gp.is_partial_match as boolean) ?? false,
    specialties: (gp.specialties as string[] | null) ?? [],
    specializations: (gp.specializations as string[] | null) ?? [],
    baseCity,
    languages: (gp.languages as string[] | null) ?? [],
    tripsCompleted: 0,
    recommendPct: null,
    verified: false,
  };
}

export async function fetchProfilesByUserIds(
  db: SupabaseClient,
  userIds: string[],
): Promise<Map<string, Record<string, unknown>>> {
  const map = new Map<string, Record<string, unknown>>();
  if (userIds.length === 0) return map;

  const { data, error } = await db.from("profiles").select("id, full_name, avatar_url").in("id", userIds);
  if (error) throw error;

  for (const profile of data ?? []) {
    map.set(profile.id as string, profile as Record<string, unknown>);
  }
  return map;
}
