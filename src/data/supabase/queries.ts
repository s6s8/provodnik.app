import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { kopecksToRub } from "@/data/money";
import { formatRussianDateRange } from "@/lib/dates";

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
  avgRating: number;
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
};

export type RequestMember = {
  id: string;
  displayName: string;
  initials: string;
  avatarUrl?: string;
};

export type RequestRecord = {
  id: string;
  destination: string;
  destinationSlug: string;
  destinationRegion: string;
  title: string;
  dateLabel: string;
  startTime?: string | null;
  endTime?: string | null;
  groupSize: number;
  capacity: number;
  budgetRub: number;
  budgetLabel: string;
  requesterName: string;
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
  dateFlexibility?: 'exact' | 'few_days' | 'week';
};

export type OfferRecord = {
  id: string;
  requestId: string;
  guideSlug: string;
  guideName: string;
  guideAvatarUrl?: string;
  guideRating: number;
  priceRub: number;
  capacity: number;
  message: string;
  status: "pending" | "accepted" | "declined" | "expired" | "withdrawn";
};

export type BookingRecord = {
  id: string;
  title: string;
  destination: string;
  dateLabel: string;
  priceRub: number;
  guideName?: string;
  travelerName?: string;
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
export type GuideFilters = { destination?: string };

export type DestinationOption = {
  name: string;
  region: string;
  guideCount: number;
};

// ---------------------------------------------------------------------------
// Admin client for public reads (bypasses RLS)
// ---------------------------------------------------------------------------

function getPublicClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars for public reads");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fallbackHeroImage =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2400&q=80";

function makeError(error: unknown) {
  return error instanceof Error ? error : new Error("Unknown Supabase error");
}

function normalizeSlug(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-");
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function titleToCategory(title: string): DestinationCategory {
  const lower = title.toLowerCase();
  if (lower.includes("байкал") || lower.includes("алтай") || lower.includes("мурман")) return "nature";
  if (lower.includes("суздал") || lower.includes("казан") || lower.includes("калининг")) return "culture";
  return "city";
}

function formatRub(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

function formatDateLabel(start: string, end?: string | null) {
  if (!end || end === start) return start;
  return `${start} - ${end}`;
}

function daysLabel(days: number): string {
  if (days === 1) return "1 день";
  if (days >= 2 && days <= 4) return `${days} дня`;
  return `${days} дней`;
}

function parseImageFromJson(jsonText: string | null | undefined): string {
  if (!jsonText) return fallbackHeroImage;
  try {
    const parsed = JSON.parse(jsonText);
    return parsed?.imageUrl ?? fallbackHeroImage;
  } catch {
    return fallbackHeroImage;
  }
}

function applyListingFilters(listings: ListingRecord[], filters?: ListingFilters) {
  if (!filters) return listings;
  return listings.filter((listing) => {
    if (filters.destination && !listing.destinationName.toLowerCase().includes(filters.destination.toLowerCase())) return false;
    if (filters.format && !listing.format.toLowerCase().includes(filters.format.toLowerCase())) return false;
    return true;
  });
}

function applyRequestFilters(requests: RequestRecord[], filters?: RequestFilters) {
  if (!filters) return requests;
  return requests.filter((request) => {
    if (filters.destination && !request.destination.toLowerCase().includes(filters.destination.toLowerCase())) return false;
    if (filters.status && request.status !== filters.status) return false;
    return true;
  });
}

function applyGuideFilters(guides: GuideRecord[], filters?: GuideFilters) {
  if (!filters?.destination) return guides;
  return guides.filter((guide) =>
    guide.destinations.some((d) => d.toLowerCase().includes(filters.destination!.toLowerCase())),
  );
}

// ---------------------------------------------------------------------------
// Row mappers (match actual DB schema)
// ---------------------------------------------------------------------------

function mapListingRow(row: Record<string, unknown>): ListingRecord {
  const priceMinor = (row.price_from_minor as number) ?? 0;
  const durationMin = (row.duration_minutes as number) ?? 480;
  const days = Math.max(1, Math.round(durationMin / 480));
  const city = (row.city as string) ?? "";
  const region = (row.region as string) ?? "";
  const imageUrl =
    (row.image_url as string | null) ??
    parseImageFromJson(row.description as string | null | undefined);

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
    guideName: "Локальный гид",
    guideAvatarUrl: undefined,
    guideHomeBase: city || region,
    rating: 0,
    reviewCount: 0,
    status: "active",
  };
}

function parseNotesJson(notes: string | null | undefined): Record<string, unknown> {
  if (!notes) return {};
  try { return JSON.parse(notes) as Record<string, unknown>; } catch { return {}; }
}

function formatCategory(cat: string): string {
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

const VALID_INTEREST_SLUGS = [
  "history", "architecture", "nature", "food", "art",
  "photo", "kids", "unusual", "nightlife",
] as const;

function mapRequestRow(row: Record<string, unknown>, requesterName = "Путешественник", requesterInitials = "П"): RequestRecord {
  const dest = (row.destination as string) ?? "Маршрут";
  const rawBudget = row.budget_minor as number | null | undefined;
  const budgetMinor = rawBudget ?? 0;
  const budgetRub = kopecksToRub(budgetMinor);
  const budgetLabel =
    rawBudget == null || rawBudget === 0
      ? "не указан"
      : `${formatRub(budgetRub)} / чел.`;
  const meta = parseNotesJson(row.notes as string);
  const imageUrl = (meta.imageUrl as string) ?? fallbackHeroImage;
  const destinationLabel = (meta.destinationLabel as string) ?? dest;

  return {
    id: row.id as string,
    destination: destinationLabel,
    destinationSlug: normalizeSlug(dest),
    destinationRegion: (meta.regionLabel as string) ?? (row.region as string) ?? "Россия",
    title: `${destinationLabel} — маршрут под группу`,
    dateLabel: (meta.dateRangeLabel as string | null) ?? formatRussianDateRange(
      (row.starts_on as string) ?? "",
      (row.ends_on as string | null) ?? null,
    ),
    startTime: row.start_time ? (row.start_time as string).slice(0, 5) : null,
    endTime: row.end_time ? (row.end_time as string).slice(0, 5) : null,
    groupSize: (row.participants_count as number) ?? 1,
    capacity: (row.group_capacity as number) ?? (row.participants_count as number) ?? 1,
    budgetRub,
    budgetLabel,
    requesterName,
    requesterInitials,
    description: (meta.description as string | null) ?? (row.description as string | null) ?? "",
    interests: Array.isArray(row.interests)
      ? (row.interests as string[]).filter((s) => (VALID_INTEREST_SLUGS as readonly string[]).includes(s))
      : [],
    mode: (row.open_to_join as boolean) === true ? "assembly" : "private",
    format: formatCategory((row.category as string) ?? ""),
    status: (row.status as RequestRecord["status"]) ?? "open",
    createdAt: (row.created_at as string) ?? "",
    offerCount: 0,
    imageUrl,
    members: [],
    dateFlexibility: (row.date_flexibility as 'exact' | 'few_days' | 'week') ?? 'exact',
  };
}

async function fetchMembersForRequests(db: SupabaseClient, requestIds: string[]): Promise<Map<string, RequestMember[]>> {
  const map = new Map<string, RequestMember[]>();
  if (requestIds.length === 0) return map;

  const { data } = await db
    .from("open_request_members")
    .select("request_id, traveler_id, profiles:traveler_id(id, full_name, avatar_url)")
    .in("request_id", requestIds)
    .eq("status", "joined");

  if (!data) return map;

  for (const row of data) {
    const reqId = row.request_id as string;
    const profileRaw = row.profiles as unknown;
    const profile = Array.isArray(profileRaw) ? profileRaw[0] as Record<string, unknown> | undefined : profileRaw as Record<string, unknown> | null;
    const fullName = (profile?.full_name as string) ?? "Участник";
    const member: RequestMember = {
      id: (profile?.id as string) ?? row.traveler_id,
      displayName: fullName,
      initials: getInitials(fullName),
      avatarUrl: (profile?.avatar_url as string) ?? undefined,
    };
    const list = map.get(reqId) ?? [];
    list.push(member);
    map.set(reqId, list);
  }

  return map;
}

function mapGuideRow(gp: Record<string, unknown>, profile: Record<string, unknown> | null): GuideRecord {
  const fullName = (profile?.full_name as string) ?? (gp.display_name as string) ?? "Локальный гид";
  const regions = (gp.regions as string[]) ?? [];
  return {
    id: gp.user_id as string,
    slug: (gp.slug as string) ?? normalizeSlug(fullName),
    fullName,
    avatarUrl: (profile?.avatar_url as string) ?? undefined,
    initials: getInitials(fullName),
    homeBase: regions[0] ?? "Россия",
    bio: (gp.bio as string) ?? "Проводник по локальным маршрутам.",
    destinations: regions,
    destinationSlugs: regions.map(normalizeSlug),
    rating: 0,
    reviewCount: 0,
    topListingTitle: undefined,
    experienceYears: (gp.years_experience as number) ?? 5,
  };
}

// ---------------------------------------------------------------------------
// Destinations (public.destinations table)
// ---------------------------------------------------------------------------

export async function getDestinations(_client: SupabaseClient): Promise<QueryResult<DestinationRecord[]>> {
  try {
    const db = getPublicClient();
    const { data, error } = await db.from("destinations").select("*").order("listing_count", { ascending: false }).limit(12);
    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    return {
      data: data.map((row, index) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        region: row.region ?? "Россия",
        category: (row.category as DestinationCategory | null) ?? titleToCategory(row.name),
        description: row.description ?? "",
        heroImageUrl: row.hero_image_url ?? fallbackHeroImage,
        listingCount: row.listing_count ?? 0,
        guidesCount: row.guides_count ?? 0,
        avgRating: row.rating ?? 4.7 + ((index % 3) * 0.1),
      })),
      error: null,
    };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}

export async function getDestinationBySlug(_client: SupabaseClient, slug: string): Promise<QueryResult<DestinationRecord>> {
  try {
    const db = getPublicClient();
    const { data, error } = await db.from("destinations").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    if (!data) return { data: null, error: null };

    return {
      data: {
        id: data.id,
        slug: data.slug,
        name: data.name,
        region: data.region ?? "Россия",
        category: (data.category as DestinationCategory | null) ?? titleToCategory(data.name),
        description: data.description ?? "",
        heroImageUrl: data.hero_image_url ?? fallbackHeroImage,
        listingCount: data.listing_count ?? 0,
        guidesCount: data.guides_count ?? 0,
        avgRating: data.rating ?? 4.8,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: makeError(error) };
  }
}

// ---------------------------------------------------------------------------
// Listings (public.listings — RLS: published are readable)
// ---------------------------------------------------------------------------

export async function getActiveListings(
  _client: SupabaseClient,
  filters?: ListingFilters,
): Promise<QueryResult<ListingRecord[]>> {
  try {
    const db = getPublicClient();
    const { data, error } = await db
      .from("listings")
      .select("*")
      .eq("status", "published")
      .order("featured_rank", { ascending: true, nullsFirst: false });

    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    return { data: applyListingFilters(data.map(mapListingRow), filters), error: null };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}

export async function getListingBySlug(
  _client: SupabaseClient,
  slug: string,
): Promise<QueryResult<ListingRecord>> {
  try {
    const db = getPublicClient();
    const { data, error } = await db.from("listings").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    if (!data) return { data: null, error: null };

    return { data: mapListingRow(data), error: null };
  } catch (error) {
    return { data: null, error: makeError(error) };
  }
}

export async function getListingsByDestination(
  _client: SupabaseClient,
  slug: string,
): Promise<QueryResult<ListingRecord[]>> {
  try {
    const db = getPublicClient();
    const { data: dest, error: destError } = await db
      .from("destinations")
      .select("name, region")
      .eq("slug", slug)
      .maybeSingle();
    if (destError) throw destError;
    if (!dest) return { data: [], error: null };

    const { data, error } = await db
      .from("listings")
      .select("*")
      .or(`city.ilike.%${dest.name}%,region.ilike.%${dest.region}%`)
      .eq("status", "published");

    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    return { data: data.map(mapListingRow), error: null };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}

export async function getListingsByGuide(
  _client: SupabaseClient,
  guideId: string,
): Promise<QueryResult<ListingRecord[]>> {
  try {
    const db = getPublicClient();
    const { data, error } = await db.from("listings").select("*").eq("guide_id", guideId).eq("status", "published");
    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    return { data: data.map(mapListingRow), error: null };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}

// ---------------------------------------------------------------------------
// Requests (public.traveler_requests)
// ---------------------------------------------------------------------------

export async function getOpenRequests(
  client: SupabaseClient,
  filters?: RequestFilters,
): Promise<QueryResult<RequestRecord[]>> {
  try {
    const db = client;
    const { data, error } = await db
      .from("traveler_requests")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    const records = data.map((row) => mapRequestRow(row));
    const membersMap = await fetchMembersForRequests(db, records.map((r) => r.id));
    for (const rec of records) {
      rec.members = membersMap.get(rec.id) ?? [];
      if (rec.members.length > 0) rec.groupSize = rec.members.length;
    }

    return { data: applyRequestFilters(records, filters), error: null };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}

export async function getRequestById(
  client: SupabaseClient,
  id: string,
): Promise<QueryResult<RequestRecord>> {
  try {
    const db = client;
    const { data, error } = await db.from("traveler_requests").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return { data: null, error: null };

    const record = mapRequestRow(data);
    const membersMap = await fetchMembersForRequests(db, [id]);
    record.members = membersMap.get(id) ?? [];
    if (record.members.length > 0) record.groupSize = record.members.length;

    return { data: record, error: null };
  } catch (error) {
    return { data: null, error: makeError(error) };
  }
}

export async function getUserRequests(
  client: SupabaseClient,
  userId: string,
): Promise<QueryResult<RequestRecord[]>> {
  try {
    const { data, error } = await client.from("traveler_requests").select("*").eq("traveler_id", userId);
    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    return { data: data.map((row) => mapRequestRow(row, "Вы", "ВЫ")), error: null };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}

// ---------------------------------------------------------------------------
// Guides (public.guide_profiles + public.profiles)
// ---------------------------------------------------------------------------

export async function getGuides(
  _client: SupabaseClient,
  filters?: GuideFilters,
): Promise<QueryResult<GuideRecord[]>> {
  try {
    const db = getPublicClient();
    const { data, error } = await db
      .from("guide_profiles")
      .select("*, profiles:user_id(id, full_name, avatar_url)")
      .eq("verification_status", "approved");

    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    const guideIds = data.map((row) => row.user_id as string);

    const { data: listingRows } = await db
      .from("listings")
      .select("guide_id")
      .eq("status", "published")
      .in("guide_id", guideIds);

    const countMap: Record<string, number> = {};
    for (const row of listingRows ?? []) {
      const gid = row.guide_id as string;
      countMap[gid] = (countMap[gid] ?? 0) + 1;
    }

    const filtered = data.filter((row) => (countMap[row.user_id as string] ?? 0) > 0);

    return {
      data: applyGuideFilters(
        filtered.map((row) => ({
          ...mapGuideRow(row, row.profiles as Record<string, unknown> | null),
          listingCount: countMap[row.user_id as string] ?? 0,
        })),
        filters,
      ),
      error: null,
    };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}

export async function getGuidesByDestination(
  _client: SupabaseClient,
  region: string,
): Promise<QueryResult<GuideRecord[]>> {
  try {
    const db = getPublicClient();
    const { data, error } = await db
      .from("guide_profiles")
      .select("*, profiles:user_id(id, full_name, avatar_url)")
      .eq("verification_status", "approved")
      .contains("regions", [region])
      .order("years_experience", { ascending: false })
      .limit(6);

    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    return {
      data: data.map((row) => mapGuideRow(row, row.profiles as Record<string, unknown> | null)),
      error: null,
    };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}

export async function getGuideBySlug(
  _client: SupabaseClient,
  slug: string,
): Promise<QueryResult<GuideRecord>> {
  try {
    const db = getPublicClient();
    const { data, error } = await db
      .from("guide_profiles")
      .select("*, profiles:user_id(id, full_name, avatar_url)")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { data: null, error: null };

    return { data: mapGuideRow(data, data.profiles as Record<string, unknown> | null), error: null };
  } catch (error) {
    return { data: null, error: makeError(error) };
  }
}

export async function getGuideLocationPhotos(
  _client: SupabaseClient,
  guideId: string,
): Promise<QueryResult<{ id: string; location_name: string; object_path: string; sort_order: number }[]>> {
  try {
    const db = getPublicClient();
    const { data, error } = await db
      .from("guide_location_photos")
      .select("id, location_name, sort_order, storage_assets!inner(object_path)")
      .eq("guide_id", guideId)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    const rows = (data ?? []) as Array<{
      id: string;
      location_name: string;
      sort_order: number;
      storage_assets: { object_path: string } | { object_path: string }[];
    }>;

    const mapped = rows.map(row => {
      const sa = Array.isArray(row.storage_assets) ? row.storage_assets[0] : row.storage_assets;
      return {
        id: row.id,
        location_name: row.location_name,
        sort_order: row.sort_order,
        object_path: sa?.object_path ?? "",
      };
    }).filter(r => r.object_path !== "");

    return { data: mapped, error: null };
  } catch (error) {
    return { data: null, error: makeError(error) };
  }
}

// ---------------------------------------------------------------------------
// Offers (public.guide_offers)
// ---------------------------------------------------------------------------

export async function getOffersForRequest(
  client: SupabaseClient,
  requestId: string,
): Promise<QueryResult<OfferRecord[]>> {
  try {
    const { data, error } = await client.from("guide_offers").select("*").eq("request_id", requestId);
    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    return {
      data: data.map((row) => ({
        id: row.id,
        requestId: row.request_id,
        guideSlug: normalizeSlug(row.guide_id),
        guideName: row.title ?? "Локальный гид",
        priceRub: Math.round(row.price_minor / 100),
        capacity: row.capacity,
        message: row.message ?? "",
        guideRating: 4.8,
        status: row.status,
      })),
      error: null,
    };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}

// ---------------------------------------------------------------------------
// Bookings (public.bookings)
// ---------------------------------------------------------------------------

export async function getUserBookings(
  client: SupabaseClient,
  userId: string,
): Promise<QueryResult<BookingRecord[]>> {
  try {
    const { data, error } = await client.from("bookings").select("*").eq("traveler_id", userId);
    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    return {
      data: data.map((b) => ({
        id: b.id,
        title: b.meeting_point ?? "Бронирование",
        destination: b.meeting_point ?? "Маршрут",
        dateLabel: formatDateLabel(b.starts_at ?? "", b.ends_at),
        priceRub: Math.round((b.subtotal_minor ?? 0) / 100),
        status: b.status,
      })),
      error: null,
    };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}

export async function getGuideBookings(
  client: SupabaseClient,
  guideId: string,
): Promise<QueryResult<BookingRecord[]>> {
  try {
    const { data, error } = await client.from("bookings").select("*").eq("guide_id", guideId);
    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    return {
      data: data.map((b) => ({
        id: b.id,
        title: b.meeting_point ?? "Бронирование",
        destination: b.meeting_point ?? "Маршрут",
        dateLabel: formatDateLabel(b.starts_at ?? "", b.ends_at),
        priceRub: Math.round((b.subtotal_minor ?? 0) / 100),
        status: b.status,
      })),
      error: null,
    };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}

// ---------------------------------------------------------------------------
// Favorites (public.favorites)
// ---------------------------------------------------------------------------

export async function getUserFavorites(
  client: SupabaseClient,
  userId: string,
): Promise<QueryResult<FavoriteRecord[]>> {
  try {
    const { data, error } = await client.from("favorites").select("*").eq("user_id", userId);
    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    return {
      data: data.map((f) => ({
        id: f.id,
        listingSlug: f.listing_id,
        createdAt: f.created_at,
      })),
      error: null,
    };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}

export async function toggleFavorite(
  client: SupabaseClient,
  userId: string,
  listingId: string,
): Promise<QueryResult<boolean>> {
  try {
    const { data: existing, error: existingError } = await client
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("listing_id", listingId)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing?.id) {
      const { error } = await client.from("favorites").delete().eq("id", existing.id);
      if (error) throw error;
      return { data: false, error: null };
    }

    const { error } = await client.from("favorites").insert({ user_id: userId, subject: "listing", listing_id: listingId });
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    return { data: false, error: makeError(error) };
  }
}

// ---------------------------------------------------------------------------
// Reviews (public.reviews — columns: booking_id, traveler_id, guide_id, listing_id)
// ---------------------------------------------------------------------------

export async function getListingReviews(_client: SupabaseClient, listingSlug: string): Promise<QueryResult<ReviewRecord[]>> {
  try {
    const db = getPublicClient();
    // First resolve listing UUID from slug
    const { data: listing } = await db.from("listings").select("id").eq("slug", listingSlug).maybeSingle();
    if (!listing) return { data: [], error: null };

    const { data, error } = await db
      .from("reviews")
      .select("*, profiles:traveler_id(full_name)")
      .eq("listing_id", listing.id)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    return {
      data: data.map((r) => ({
        id: r.id,
        authorName: (r.profiles as Record<string, unknown>)?.full_name as string ?? "Путешественник",
        rating: r.rating,
        title: r.title ?? "Отзыв",
        body: r.body ?? "",
        createdAt: r.created_at,
      })),
      error: null,
    };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}

export async function getGuideReviews(_client: SupabaseClient, guideSlug: string): Promise<QueryResult<ReviewRecord[]>> {
  try {
    const db = getPublicClient();
    // First resolve guide UUID from slug
    const { data: gp } = await db.from("guide_profiles").select("user_id").eq("slug", guideSlug).maybeSingle();
    if (!gp) return { data: [], error: null };

    const { data, error } = await db
      .from("reviews")
      .select("*, profiles:traveler_id(full_name)")
      .eq("guide_id", gp.user_id)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    return {
      data: data.map((r) => ({
        id: r.id,
        authorName: (r.profiles as Record<string, unknown>)?.full_name as string ?? "Путешественник",
        rating: r.rating,
        title: r.title ?? "Отзыв",
        body: r.body ?? "",
        createdAt: r.created_at,
      })),
      error: null,
    };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}

// ---------------------------------------------------------------------------
// Homepage2 — Диалог concept queries
// ---------------------------------------------------------------------------

export async function getActiveGuideDestinations(
  client: SupabaseClient,
): Promise<QueryResult<DestinationOption[]>> {
  try {
    const { data, error } = await client
      .from("listings")
      .select("city, region, guide_id")
      .eq("status", "published")
      .not("city", "is", null);

    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    const map = new Map<string, { name: string; region: string; guides: Set<string> }>();
    for (const row of data) {
      const key = `${row.city}|${row.region}`;
      if (!map.has(key)) {
        map.set(key, { name: row.city as string, region: (row.region as string) ?? "", guides: new Set() });
      }
      map.get(key)!.guides.add(row.guide_id as string);
    }

    const result: DestinationOption[] = Array.from(map.values())
      .map(({ name, region, guides }) => ({ name, region, guideCount: guides.size }))
      .sort((a, b) => b.guideCount - a.guideCount)
      .slice(0, 50);

    return { data: result, error: null };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}

export async function getHomepageRequests(
  client: SupabaseClient,
): Promise<QueryResult<RequestRecord[]>> {
  try {
    const { data: rows, error } = await client
      .from("traveler_requests")
      .select("*")
      .eq("status", "open")
      .gt("budget_minor", 0)
      .order("created_at", { ascending: false })
      .limit(4);

    if (error) throw error;
    if (!rows || rows.length === 0) return { data: [], error: null };

    const ids = rows.map((r) => r.id as string);

    const { data: offerRows } = await client
      .from("guide_offers")
      .select("request_id")
      .in("request_id", ids);

    const countMap: Record<string, number> = {};
    for (const row of offerRows ?? []) {
      countMap[row.request_id as string] = (countMap[row.request_id as string] ?? 0) + 1;
    }

    const records = rows.map((row) => {
      const rec = mapRequestRow(row);
      rec.offerCount = countMap[rec.id] ?? 0;
      return rec;
    });

    const filtered = records.filter((rec) => {
      if (rec.mode !== "assembly") return true;
      const remaining = rec.capacity - rec.groupSize;
      return remaining > 0 || rec.offerCount > 0;
    });

    filtered.sort(
      (a, b) =>
        (b.offerCount > 0 ? 1 : 0) - (a.offerCount > 0 ? 1 : 0) ||
        b.createdAt.localeCompare(a.createdAt),
    );

    return { data: filtered, error: null };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}

export async function getSimilarRequests(
  client: SupabaseClient,
  destinationSlug: string,
  excludeId: string,
): Promise<QueryResult<RequestRecord[]>> {
  try {
    const { data, error } = await client
      .from("traveler_requests")
      .select("*")
      .eq("status", "open")
      .neq("id", excludeId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    const records = data.map((row) => mapRequestRow(row));
    const sameSlug = records.filter((r) => r.destinationSlug === destinationSlug);
    const result = sameSlug.length >= 2 ? sameSlug.slice(0, 3) : records.slice(0, 2);

    return { data: result, error: null };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}
