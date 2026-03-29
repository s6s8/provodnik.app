import type { SupabaseClient } from "@supabase/supabase-js";

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
};

export type RequestRecord = {
  id: string;
  destination: string;
  destinationSlug: string;
  destinationRegion: string;
  title: string;
  dateLabel: string;
  groupSize: number;
  capacity: number;
  budgetRub: number;
  budgetLabel: string;
  requesterName: string;
  requesterInitials: string;
  description: string;
  format: string;
  status: "open" | "booked" | "cancelled" | "expired";
  createdAt: string;
  offerCount: number;
  imageUrl: string;
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
    guide.destinations.some((destination) => destination.toLowerCase().includes(filters.destination!.toLowerCase())),
  );
}

type ReviewRow = {
  id: string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
};

function mapReviewRow(review: ReviewRow): ReviewRecord {
  return {
    id: review.id,
    authorName: review.author_name,
    rating: review.rating,
    title: review.title ?? "Отзыв",
    body: review.body ?? "",
    createdAt: review.created_at,
  };
}

function mapListingRow(row: Record<string, unknown>): ListingRecord {
  const priceMinor = (row.price_from_minor as number) ?? 0;
  const durationMin = (row.duration_minutes as number) ?? 480;
  const days = Math.max(1, Math.round(durationMin / 480));
  const city = (row.city as string) ?? (row.region as string) ?? "";
  const region = (row.region as string) ?? "";
  const descJson = typeof row.description === "string" ? row.description : "";
  let imageUrl = fallbackHeroImage;
  try {
    const parsed = JSON.parse(descJson);
    if (parsed?.imageUrl) imageUrl = parsed.imageUrl;
  } catch { /* not JSON, use fallback */ }

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
    durationLabel: `${days} ${days === 1 ? "день" : days < 5 ? "дня" : "дней"}`,
    groupSize: (row.max_group_size as number) ?? 6,
    difficulty: (row.category as string)?.includes("природ") ? "Средняя" : "Лёгкая",
    departure: (row.meeting_point as string) ?? city ?? region,
    format: (row.category as string) ?? "Авторский маршрут",
    description: (row.route_summary as string) ?? "",
    inclusions: (row.inclusions as string[]) ?? [],
    exclusions: (row.exclusions as string[]) ?? [],
    guideSlug: normalizeSlug((row.guide_id as string) ?? ""),
    guideName: "Локальный гид",
    guideAvatarUrl: undefined,
    guideHomeBase: city || region,
    rating: 4.8,
    reviewCount: 0,
    status: "active",
  };
}

function mapRequestRow(row: Record<string, unknown>, requesterName = "Путешественник Provodnik", requesterInitials = "ПП"): RequestRecord {
  const dest = (row.destination as string) ?? "Маршрут";
  const budgetMinor = (row.budget_minor as number) ?? 0;
  const budgetRub = Math.round(budgetMinor / 100);
  let imageUrl = fallbackHeroImage;
  const notes = (row.notes as string) ?? "";
  try {
    const parsed = JSON.parse(notes);
    if (parsed?.imageUrl) imageUrl = parsed.imageUrl;
  } catch { /* not JSON */ }

  return {
    id: row.id as string,
    destination: dest,
    destinationSlug: normalizeSlug(dest),
    destinationRegion: (row.region as string) ?? "Россия",
    title: `${dest} — маршрут под группу`,
    dateLabel: formatDateLabel((row.starts_on as string) ?? "", row.ends_on as string | null),
    groupSize: (row.participants_count as number) ?? 1,
    capacity: (row.group_capacity as number) ?? (row.participants_count as number) ?? 1,
    budgetRub,
    budgetLabel: budgetMinor ? `${formatRub(budgetRub)} / чел.` : "По договорённости",
    requesterName,
    requesterInitials,
    description: notes,
    format: (row.category as string) ?? "",
    status: (row.status as RequestRecord["status"]) ?? "open",
    createdAt: (row.created_at as string) ?? "",
    offerCount: 0,
    imageUrl,
  };
}

// ---------------------------------------------------------------------------
// Destinations
// ---------------------------------------------------------------------------

export async function getDestinations(client: SupabaseClient): Promise<QueryResult<DestinationRecord[]>> {
  try {
    const { data, error } = await client.from("destinations").select("*").order("listing_count", { ascending: false }).limit(12);
    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    return {
      data: data.map((row, index) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        region: row.region ?? "Россия",
        category: (row.category as DestinationCategory | null) ?? titleToCategory(row.name),
        description: row.description ?? "Маршрут с локальным проводником и плавным темпом.",
        heroImageUrl: row.hero_image_url ?? fallbackHeroImage,
        listingCount: row.listing_count ?? 0,
        guidesCount: row.guides_count ?? Math.max(3, Math.round((row.listing_count ?? 6) / 2)),
        avgRating: row.rating ?? 4.7 + ((index % 3) * 0.1),
      })),
      error: null,
    };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}

export async function getDestinationBySlug(client: SupabaseClient, slug: string): Promise<QueryResult<DestinationRecord>> {
  try {
    const { data, error } = await client.from("destinations").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    if (!data) return { data: null, error: null };

    return {
      data: {
        id: data.id,
        slug: data.slug,
        name: data.name,
        region: data.region ?? "Россия",
        category: (data.category as DestinationCategory | null) ?? titleToCategory(data.name),
        description: data.description ?? "Маршрут с локальным проводником и плавным темпом.",
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
// Listings
// ---------------------------------------------------------------------------

export async function getActiveListings(
  client: SupabaseClient,
  filters?: ListingFilters,
): Promise<QueryResult<ListingRecord[]>> {
  try {
    const { data, error } = await client
      .from("listings")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    return { data: applyListingFilters(data.map(mapListingRow), filters), error: null };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}

export async function getListingBySlug(
  client: SupabaseClient,
  slug: string,
): Promise<QueryResult<ListingRecord>> {
  try {
    const { data, error } = await client.from("listings").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    if (!data) return { data: null, error: null };

    return { data: mapListingRow(data), error: null };
  } catch (error) {
    return { data: null, error: makeError(error) };
  }
}

export async function getListingsByDestination(
  client: SupabaseClient,
  slug: string,
): Promise<QueryResult<ListingRecord[]>> {
  try {
    const { data, error } = await client
      .from("listings")
      .select("*")
      .or(`city.ilike.%${slug}%,region.ilike.%${slug}%`)
      .eq("status", "published");

    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    return { data: data.map(mapListingRow), error: null };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}

export async function getListingsByGuide(
  client: SupabaseClient,
  guideId: string,
): Promise<QueryResult<ListingRecord[]>> {
  try {
    const { data, error } = await client.from("listings").select("*").eq("guide_id", guideId);
    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    return { data: data.map(mapListingRow), error: null };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export async function getOpenRequests(
  client: SupabaseClient,
  filters?: RequestFilters,
): Promise<QueryResult<RequestRecord[]>> {
  try {
    const { data, error } = await client
      .from("traveler_requests")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    return { data: applyRequestFilters(data.map((row) => mapRequestRow(row)), filters), error: null };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}

export async function getRequestById(
  client: SupabaseClient,
  id: string,
): Promise<QueryResult<RequestRecord>> {
  try {
    const { data, error } = await client.from("traveler_requests").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return { data: null, error: null };

    return { data: mapRequestRow(data), error: null };
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
// Guides
// ---------------------------------------------------------------------------

export async function getGuides(
  client: SupabaseClient,
  filters?: GuideFilters,
): Promise<QueryResult<GuideRecord[]>> {
  try {
    const { data, error } = await client.from("guide_profiles").select("*, profiles!inner(id, full_name, avatar_url)");
    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    return {
      data: applyGuideFilters(
        data.map((row) => {
          const profile = row.profiles as Record<string, unknown> | null;
          const fullName = (profile?.full_name as string) ?? row.display_name ?? "Локальный гид";
          return {
            id: row.user_id as string,
            slug: row.slug ?? normalizeSlug(fullName),
            fullName,
            avatarUrl: (profile?.avatar_url as string) ?? undefined,
            initials: getInitials(fullName),
            homeBase: (row.regions as string[])?.[0] ?? "Россия",
            bio: row.bio ?? "Проводник по локальным маршрутам и камерным поездкам.",
            destinations: (row.regions as string[]) ?? [],
            destinationSlugs: ((row.regions as string[]) ?? []).map(normalizeSlug),
            rating: 4.8,
            reviewCount: 0,
            topListingTitle: undefined,
            experienceYears: row.years_experience ?? 5,
          };
        }),
        filters,
      ),
      error: null,
    };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}

export async function getGuideBySlug(
  client: SupabaseClient,
  slug: string,
): Promise<QueryResult<GuideRecord>> {
  try {
    const { data, error } = await client.from("guide_profiles").select("*, profiles!inner(id, full_name, avatar_url)").eq("slug", slug).maybeSingle();
    if (error) throw error;
    if (!data) return { data: null, error: null };

    const profile = data.profiles as Record<string, unknown> | null;
    const fullName = (profile?.full_name as string) ?? data.display_name ?? "Локальный гид";
    return {
      data: {
        id: data.user_id as string,
        slug: data.slug ?? slug,
        fullName,
        avatarUrl: (profile?.avatar_url as string) ?? undefined,
        initials: getInitials(fullName),
        homeBase: (data.regions as string[])?.[0] ?? "Россия",
        bio: data.bio ?? "Проводник по локальным маршрутам и камерным поездкам.",
        destinations: (data.regions as string[]) ?? [],
        destinationSlugs: ((data.regions as string[]) ?? []).map(normalizeSlug),
        rating: 4.8,
        reviewCount: 0,
        experienceYears: data.years_experience ?? 5,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: makeError(error) };
  }
}

// ---------------------------------------------------------------------------
// Offers
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
// Bookings
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
      data: data.map((booking) => ({
        id: booking.id,
        title: booking.request_id ?? "Бронирование",
        destination: booking.meeting_point ?? "Маршрут",
        dateLabel: formatDateLabel(booking.starts_at ?? "", booking.ends_at),
        priceRub: Math.round(booking.subtotal_minor / 100),
        status: booking.status,
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
      data: data.map((booking) => ({
        id: booking.id,
        title: booking.request_id ?? "Бронирование",
        destination: booking.meeting_point ?? "Маршрут",
        dateLabel: formatDateLabel(booking.starts_at ?? "", booking.ends_at),
        priceRub: Math.round(booking.subtotal_minor / 100),
        status: booking.status,
      })),
      error: null,
    };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}

// ---------------------------------------------------------------------------
// Favorites
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
      data: data.map((favorite) => ({
        id: favorite.id,
        listingSlug: favorite.listing_id,
        createdAt: favorite.created_at,
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

    const { error } = await client.from("favorites").insert({ user_id: userId, listing_id: listingId });
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    return { data: false, error: makeError(error) };
  }
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export async function getListingReviews(client: SupabaseClient, slug: string): Promise<QueryResult<ReviewRecord[]>> {
  try {
    const { data, error } = await client.from("reviews").select("*").eq("target_type", "listing").eq("target_slug", slug);
    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };
    return { data: data.map(mapReviewRow), error: null };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}

export async function getGuideReviews(client: SupabaseClient, slug: string): Promise<QueryResult<ReviewRecord[]>> {
  try {
    const { data, error } = await client.from("reviews").select("*").eq("target_type", "guide").eq("target_slug", slug);
    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };
    return { data: data.map(mapReviewRow), error: null };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}
