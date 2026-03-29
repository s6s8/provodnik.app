import type { SupabaseClient } from "@supabase/supabase-js";

import { seededDestinations } from "@/data/destinations/seed";
import { listSeededFavoritesForUser } from "@/data/favorites/seed";
import { getSeededPublicGuide, seededPublicGuides } from "@/data/public-guides/seed";
import type { PublicGuideProfile } from "@/data/public-guides/types";
import { getSeededPublicListing, seededPublicListings } from "@/data/public-listings/seed";
import type { PublicListing } from "@/data/public-listings/types";
import { getSeededReviewsSummaryForTarget, listSeededReviewsForTarget } from "@/data/reviews/seed";
import { seededGuideBookings } from "@/data/guide-booking/seed";
import { getSeededTravelerRequestById, seededTravelerOffers, seededTravelerRequests } from "@/data/traveler-request/seed";
import { seededTravelerBookings } from "@/data/traveler-booking/seed";

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
type ReviewRow = {
  id: string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
};

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

function mapDestinationSeed(): DestinationRecord[] {
  return seededDestinations.map((destination, index) => ({
    id: `dest-seed-${destination.slug}`,
    slug: destination.slug,
    name: destination.name,
    region: destination.region ?? "Россия",
    category: titleToCategory(destination.name),
    description: destination.description ?? "Маршрут с локальным проводником и спокойным темпом.",
    heroImageUrl: destination.imageUrl ?? fallbackHeroImage,
    listingCount: destination.listingCount ?? 0,
    guidesCount: Math.max(3, Math.round((destination.listingCount ?? 6) / 2)),
    avgRating: 4.7 + ((index % 3) * 0.1),
  }));
}

function mapGuideSeed(guide: PublicGuideProfile): GuideRecord {
  const topListing = seededPublicListings.find((listing) => listing.guideSlug === guide.slug);

  return {
    id: `guide-seed-${guide.slug}`,
    slug: guide.slug,
    fullName: guide.displayName,
    avatarUrl: guide.avatarImageUrl,
    initials: guide.avatarInitials ?? getInitials(guide.displayName),
    homeBase: guide.homeBase,
    bio: guide.bio,
    destinations: [...guide.regions],
    destinationSlugs: guide.regions.map(normalizeSlug),
    rating: guide.reviewsSummary.averageRating,
    reviewCount: guide.reviewsSummary.totalReviews,
    topListingTitle: topListing?.title,
    experienceYears: guide.yearsExperience,
  };
}

function mapListingSeed(listing: PublicListing): ListingRecord {
  const guide = getSeededPublicGuide(listing.guideSlug);
  const reviews = getSeededReviewsSummaryForTarget("listing", listing.slug);
  const destination = mapDestinationSeed().find((item) => item.region.toLowerCase().includes(listing.region.toLowerCase()));

  return {
    id: `listing-seed-${listing.slug}`,
    slug: listing.slug,
    title: listing.title,
    destinationSlug: destination?.slug ?? normalizeSlug(listing.city),
    destinationName: listing.city,
    destinationRegion: listing.region,
    imageUrl: listing.coverImageUrl ?? fallbackHeroImage,
    priceRub: listing.priceFromRub,
    durationDays: listing.durationDays,
    durationLabel: `${listing.durationDays} ${listing.durationDays === 1 ? "день" : listing.durationDays < 5 ? "дня" : "дней"}`,
    groupSize: listing.groupSizeMax,
    difficulty: listing.durationDays > 1 ? "Средняя" : "Лёгкая",
    departure: listing.city,
    format: listing.themes[0] ?? "Авторский маршрут",
    description: listing.highlights.join(". "),
    inclusions: [...listing.inclusions],
    exclusions: ["Авиабилеты", "Личные расходы"],
    guideSlug: listing.guideSlug,
    guideName: guide?.displayName ?? "Локальный гид",
    guideAvatarUrl: guide?.avatarImageUrl,
    guideHomeBase: guide?.homeBase ?? listing.city,
    rating: reviews.averageRating || guide?.reviewsSummary.averageRating || 4.8,
    reviewCount: reviews.totalReviews || guide?.reviewsSummary.totalReviews || 0,
    status: "active",
  };
}

function mapRequestSeeds(): RequestRecord[] {
  return seededTravelerRequests.map((item) => ({
    id: item.id,
    destination: item.request.destination,
    destinationSlug: normalizeSlug(item.request.destination),
    destinationRegion: "Россия",
    title: `${item.request.destination} — маршрут под вашу компанию`,
    dateLabel: formatDateLabel(item.request.startDate, item.request.endDate),
    groupSize: item.request.groupSize,
    capacity: Math.max(item.request.groupSize + 2, 4),
    budgetRub: item.request.budgetPerPersonRub,
    budgetLabel: `${formatRub(item.request.budgetPerPersonRub)} / чел.`,
    requesterName: "Алексей Козлов",
    requesterInitials: "АК",
    description: item.request.notes ?? "Нужен маршрут с локальным проводником и ясной логистикой.",
    format: item.request.experienceType,
    status: item.status === "booked" ? "booked" : item.status === "closed" ? "expired" : "open",
    createdAt: item.createdAt,
    offerCount: seededTravelerOffers.filter((offer) => offer.requestId === item.id).length,
    imageUrl:
      mapDestinationSeed().find((destination) => destination.slug === normalizeSlug(item.request.destination))
        ?.heroImageUrl ?? fallbackHeroImage,
  }));
}

function mapOfferSeeds(requestId: string): OfferRecord[] {
  return seededTravelerOffers
    .filter((offer) => offer.requestId === requestId)
    .map((offer) => ({
      id: offer.id,
      requestId: offer.requestId,
      guideSlug: normalizeSlug(offer.guide.name),
      guideName: offer.guide.name,
      guideRating: offer.guide.rating,
      priceRub: offer.priceTotalRub,
      capacity: offer.groupSizeMax,
      message: offer.message,
      status: offer.status === "accepted" ? "accepted" : offer.status === "declined" ? "declined" : "pending",
    }));
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

export async function getDestinations(client: SupabaseClient): Promise<QueryResult<DestinationRecord[]>> {
  const fallback = mapDestinationSeed();

  try {
    const { data, error } = await client.from("destinations").select("*").order("listing_count", { ascending: false }).limit(12);
    if (error) throw error;
    if (!data || data.length === 0) return { data: fallback, error: null };

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
    return { data: fallback, error: makeError(error) };
  }
}

export async function getDestinationBySlug(client: SupabaseClient, slug: string): Promise<QueryResult<DestinationRecord>> {
  try {
    const { data, error } = await client.from("destinations").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    if (!data) return { data: mapDestinationSeed().find((item) => item.slug === slug) ?? null, error: null };

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
    return { data: mapDestinationSeed().find((item) => item.slug === slug) ?? null, error: makeError(error) };
  }
}

export async function getActiveListings(
  client: SupabaseClient,
  filters?: ListingFilters,
): Promise<QueryResult<ListingRecord[]>> {
  const fallback = seededPublicListings.map(mapListingSeed);

  try {
    const { data, error } = await client
      .from("listings")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return { data: applyListingFilters(fallback, filters), error: null };

    return {
      data: applyListingFilters(
        data.map((row) => ({
          id: row.id,
          slug: row.slug,
          title: row.title,
          destinationSlug: normalizeSlug(row.city ?? row.region),
          destinationName: row.city ?? row.region,
          destinationRegion: row.region,
          imageUrl: fallbackHeroImage,
          priceRub: Math.round(row.price_from_minor / 100),
          durationDays: Math.max(1, Math.round((row.duration_minutes ?? 480) / 480)),
          durationLabel: `${Math.max(1, Math.round((row.duration_minutes ?? 480) / 480))} дн.`,
          groupSize: row.max_group_size,
          difficulty: row.category === "nature" ? "Средняя" : "Лёгкая",
          departure: row.meeting_point ?? row.city ?? row.region,
          format: row.category,
          description: row.description ?? row.route_summary ?? "",
          inclusions: row.inclusions,
          exclusions: row.exclusions,
          guideSlug: normalizeSlug(row.guide_id),
          guideName: "Локальный гид",
          guideHomeBase: row.city ?? row.region,
          rating: 4.8,
          reviewCount: 0,
          status: "active",
        })),
        filters,
      ),
      error: null,
    };
  } catch (error) {
    return { data: applyListingFilters(fallback, filters), error: makeError(error) };
  }
}

export async function getListingBySlug(
  client: SupabaseClient,
  slug: string,
): Promise<QueryResult<ListingRecord>> {
  try {
    const { data, error } = await client.from("listings").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    if (!data) return { data: seededPublicListings.map(mapListingSeed).find((item) => item.slug === slug) ?? null, error: null };

    return {
      data: {
        id: data.id,
        slug: data.slug,
        title: data.title,
        destinationSlug: normalizeSlug(data.city ?? data.region),
        destinationName: data.city ?? data.region,
        destinationRegion: data.region,
        imageUrl: fallbackHeroImage,
        priceRub: Math.round(data.price_from_minor / 100),
        durationDays: Math.max(1, Math.round((data.duration_minutes ?? 480) / 480)),
        durationLabel: `${Math.max(1, Math.round((data.duration_minutes ?? 480) / 480))} дн.`,
        groupSize: data.max_group_size,
        difficulty: data.category === "nature" ? "Средняя" : "Лёгкая",
        departure: data.meeting_point ?? data.city ?? data.region,
        format: data.category,
        description: data.description ?? data.route_summary ?? "",
        inclusions: data.inclusions,
        exclusions: data.exclusions,
        guideSlug: normalizeSlug(data.guide_id),
        guideName: "Локальный гид",
        guideHomeBase: data.city ?? data.region,
        rating: 4.8,
        reviewCount: 0,
        status: "active",
      },
      error: null,
    };
  } catch (error) {
    return { data: seededPublicListings.map(mapListingSeed).find((item) => item.slug === slug) ?? null, error: makeError(error) };
  }
}

export async function getListingsByDestination(
  client: SupabaseClient,
  slug: string,
): Promise<QueryResult<ListingRecord[]>> {
  const fallback = seededPublicListings
    .filter((listing) => {
      const citySlug = normalizeSlug(listing.city);
      const regionSlug = normalizeSlug(listing.region);

      return citySlug === slug || regionSlug === slug || (slug === "lake-baikal" && regionSlug.includes("irkut"));
    })
    .map(mapListingSeed);

  try {
    const { data, error } = await client
      .from("listings")
      .select("*")
      .or(`city.ilike.%${slug}%,region.ilike.%${slug}%`)
      .eq("status", "published");

    if (error) throw error;
    if (!data || data.length === 0) return { data: fallback, error: null };

    return {
      data: data.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        destinationSlug: normalizeSlug(row.city ?? row.region),
        destinationName: row.city ?? row.region,
        destinationRegion: row.region,
        imageUrl: fallbackHeroImage,
        priceRub: Math.round(row.price_from_minor / 100),
        durationDays: Math.max(1, Math.round((row.duration_minutes ?? 480) / 480)),
        durationLabel: `${Math.max(1, Math.round((row.duration_minutes ?? 480) / 480))} дн.`,
        groupSize: row.max_group_size,
        difficulty: row.category === "nature" ? "Средняя" : "Лёгкая",
        departure: row.meeting_point ?? row.city ?? row.region,
        format: row.category,
        description: row.description ?? row.route_summary ?? "",
        inclusions: row.inclusions,
        exclusions: row.exclusions,
        guideSlug: normalizeSlug(row.guide_id),
        guideName: "Локальный гид",
        guideHomeBase: row.city ?? row.region,
        rating: 4.8,
        reviewCount: 0,
        status: "active",
      })),
      error: null,
    };
  } catch (error) {
    return { data: fallback, error: makeError(error) };
  }
}

export async function getListingsByGuide(
  client: SupabaseClient,
  guideId: string,
): Promise<QueryResult<ListingRecord[]>> {
  const fallback = seededPublicListings
    .filter((listing) => listing.guideSlug === guideId || normalizeSlug(listing.guideSlug) === normalizeSlug(guideId))
    .map(mapListingSeed);

  try {
    const { data, error } = await client.from("listings").select("*").eq("guide_id", guideId);
    if (error) throw error;
    if (!data || data.length === 0) return { data: fallback, error: null };

    return {
      data: data.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        destinationSlug: normalizeSlug(row.city ?? row.region),
        destinationName: row.city ?? row.region,
        destinationRegion: row.region,
        imageUrl: fallbackHeroImage,
        priceRub: Math.round(row.price_from_minor / 100),
        durationDays: Math.max(1, Math.round((row.duration_minutes ?? 480) / 480)),
        durationLabel: `${Math.max(1, Math.round((row.duration_minutes ?? 480) / 480))} дн.`,
        groupSize: row.max_group_size,
        difficulty: row.category === "nature" ? "Средняя" : "Лёгкая",
        departure: row.meeting_point ?? row.city ?? row.region,
        format: row.category,
        description: row.description ?? row.route_summary ?? "",
        inclusions: row.inclusions,
        exclusions: row.exclusions,
        guideSlug: normalizeSlug(row.guide_id),
        guideName: "Локальный гид",
        guideHomeBase: row.city ?? row.region,
        rating: 4.8,
        reviewCount: 0,
        status: "active",
      })),
      error: null,
    };
  } catch (error) {
    return { data: fallback, error: makeError(error) };
  }
}

export async function getOpenRequests(
  client: SupabaseClient,
  filters?: RequestFilters,
): Promise<QueryResult<RequestRecord[]>> {
  const fallback = mapRequestSeeds();

  try {
    const { data, error } = await client
      .from("traveler_requests")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return { data: applyRequestFilters(fallback, filters), error: null };

    return {
      data: applyRequestFilters(
        data.map((row) => ({
          id: row.id,
          destination: row.destination,
          destinationSlug: normalizeSlug(row.destination),
          destinationRegion: row.region ?? "Россия",
          title: `${row.destination} — маршрут под группу`,
          dateLabel: formatDateLabel(row.starts_on, row.ends_on),
          groupSize: row.participants_count,
          capacity: row.group_capacity ?? row.participants_count,
          budgetRub: Math.round((row.budget_minor ?? 0) / 100),
          budgetLabel: row.budget_minor ? `${formatRub(Math.round(row.budget_minor / 100))} / чел.` : "По договорённости",
          requesterName: "Путешественник Provodnik",
          requesterInitials: "ПП",
          description: row.notes ?? "Нужен маршрут с локальной экспертизой и ясной логистикой.",
          format: row.category,
          status: row.status,
          createdAt: row.created_at,
          offerCount: 0,
          imageUrl: fallbackHeroImage,
        })),
        filters,
      ),
      error: null,
    };
  } catch (error) {
    return { data: applyRequestFilters(fallback, filters), error: makeError(error) };
  }
}

export async function getRequestById(
  client: SupabaseClient,
  id: string,
): Promise<QueryResult<RequestRecord>> {
  try {
    const { data, error } = await client.from("traveler_requests").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return { data: mapRequestSeeds().find((request) => request.id === id) ?? null, error: null };

    return {
      data: {
        id: data.id,
        destination: data.destination,
        destinationSlug: normalizeSlug(data.destination),
        destinationRegion: data.region ?? "Россия",
        title: `${data.destination} — маршрут под группу`,
        dateLabel: formatDateLabel(data.starts_on, data.ends_on),
        groupSize: data.participants_count,
        capacity: data.group_capacity ?? data.participants_count,
        budgetRub: Math.round((data.budget_minor ?? 0) / 100),
        budgetLabel: data.budget_minor ? `${formatRub(Math.round(data.budget_minor / 100))} / чел.` : "По договорённости",
        requesterName: "Путешественник Provodnik",
        requesterInitials: "ПП",
        description: data.notes ?? "Нужен маршрут с локальной экспертизой и ясной логистикой.",
        format: data.category,
        status: data.status,
        createdAt: data.created_at,
        offerCount: 0,
        imageUrl: fallbackHeroImage,
      },
      error: null,
    };
  } catch (error) {
    return { data: mapRequestSeeds().find((request) => request.id === id) ?? null, error: makeError(error) };
  }
}

export async function getUserRequests(
  client: SupabaseClient,
  userId: string,
): Promise<QueryResult<RequestRecord[]>> {
  try {
    const { data, error } = await client.from("traveler_requests").select("*").eq("traveler_id", userId);
    if (error) throw error;
    if (!data || data.length === 0) return { data: mapRequestSeeds(), error: null };
    return {
      data: data.map((row) => ({
        id: row.id,
        destination: row.destination,
        destinationSlug: normalizeSlug(row.destination),
        destinationRegion: row.region ?? "Россия",
        title: `${row.destination} — маршрут под группу`,
        dateLabel: formatDateLabel(row.starts_on, row.ends_on),
        groupSize: row.participants_count,
        capacity: row.group_capacity ?? row.participants_count,
        budgetRub: Math.round((row.budget_minor ?? 0) / 100),
        budgetLabel: row.budget_minor ? `${formatRub(Math.round(row.budget_minor / 100))} / чел.` : "По договорённости",
        requesterName: "Вы",
        requesterInitials: "ВЫ",
        description: row.notes ?? "Нужен маршрут с локальной экспертизой и ясной логистикой.",
        format: row.category,
        status: row.status,
        createdAt: row.created_at,
        offerCount: 0,
        imageUrl: fallbackHeroImage,
      })),
      error: null,
    };
  } catch (error) {
    return { data: mapRequestSeeds(), error: makeError(error) };
  }
}

export async function getGuides(
  client: SupabaseClient,
  filters?: GuideFilters,
): Promise<QueryResult<GuideRecord[]>> {
  const fallback = seededPublicGuides.map(mapGuideSeed);

  try {
    const { data, error } = await client.from("profiles").select("*").eq("role", "guide");
    if (error) throw error;
    if (!data || data.length === 0) return { data: applyGuideFilters(fallback, filters), error: null };

    return {
      data: applyGuideFilters(
        data.map((row) => ({
          id: row.id,
          slug: row.slug ?? normalizeSlug(row.full_name ?? row.id),
          fullName: row.full_name ?? "Локальный гид",
          avatarUrl: row.avatar_url ?? undefined,
          initials: getInitials(row.full_name ?? "Гид"),
          homeBase: row.home_base ?? "Россия",
          bio: row.bio ?? "Проводник по локальным маршрутам и камерным поездкам.",
          destinations: [row.home_base ?? "Россия"],
          destinationSlugs: [normalizeSlug(row.home_base ?? "russia")],
          rating: 4.8,
          reviewCount: 0,
          topListingTitle: undefined,
          experienceYears: 5,
        })),
        filters,
      ),
      error: null,
    };
  } catch (error) {
    return { data: applyGuideFilters(fallback, filters), error: makeError(error) };
  }
}

export async function getGuideBySlug(
  client: SupabaseClient,
  slug: string,
): Promise<QueryResult<GuideRecord>> {
  try {
    const { data, error } = await client.from("profiles").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    if (!data) return { data: seededPublicGuides.map(mapGuideSeed).find((guide) => guide.slug === slug) ?? null, error: null };

    return {
      data: {
        id: data.id,
        slug: data.slug ?? slug,
        fullName: data.full_name ?? "Локальный гид",
        avatarUrl: data.avatar_url ?? undefined,
        initials: getInitials(data.full_name ?? "Гид"),
        homeBase: data.home_base ?? "Россия",
        bio: data.bio ?? "Проводник по локальным маршрутам и камерным поездкам.",
        destinations: [data.home_base ?? "Россия"],
        destinationSlugs: [normalizeSlug(data.home_base ?? "russia")],
        rating: 4.8,
        reviewCount: 0,
        experienceYears: 5,
      },
      error: null,
    };
  } catch (error) {
    return { data: seededPublicGuides.map(mapGuideSeed).find((guide) => guide.slug === slug) ?? null, error: makeError(error) };
  }
}

export async function getOffersForRequest(
  client: SupabaseClient,
  requestId: string,
): Promise<QueryResult<OfferRecord[]>> {
  try {
    const { data, error } = await client.from("guide_offers").select("*").eq("request_id", requestId);
    if (error) throw error;
    if (!data || data.length === 0) return { data: mapOfferSeeds(requestId), error: null };

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
    return { data: mapOfferSeeds(requestId), error: makeError(error) };
  }
}

export async function getUserBookings(
  client: SupabaseClient,
  userId: string,
): Promise<QueryResult<BookingRecord[]>> {
  try {
    const { data, error } = await client.from("bookings").select("*").eq("traveler_id", userId);
    if (error) throw error;
    if (!data || data.length === 0) {
      return {
        data: seededTravelerBookings.map((booking) => ({
          id: booking.id,
          title: booking.request.destination,
          destination: booking.request.destination,
          dateLabel: formatDateLabel(booking.request.startDate, booking.request.endDate),
          priceRub: booking.payment.lineItems.reduce((sum, line) => sum + line.amountRub, 0),
          guideName: booking.guide.displayName,
          status: booking.status,
        })),
        error: null,
      };
    }

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
    return {
      data: seededTravelerBookings.map((booking) => ({
        id: booking.id,
        title: booking.request.destination,
        destination: booking.request.destination,
        dateLabel: formatDateLabel(booking.request.startDate, booking.request.endDate),
        priceRub: booking.payment.lineItems.reduce((sum, line) => sum + line.amountRub, 0),
        guideName: booking.guide.displayName,
        status: booking.status,
      })),
      error: makeError(error),
    };
  }
}

export async function getGuideBookings(
  client: SupabaseClient,
  guideId: string,
): Promise<QueryResult<BookingRecord[]>> {
  try {
    const { data, error } = await client.from("bookings").select("*").eq("guide_id", guideId);
    if (error) throw error;
    if (!data || data.length === 0) {
      return {
        data: seededGuideBookings.map((booking) => ({
          id: booking.id,
          title: booking.request.destination,
          destination: booking.request.destination,
          dateLabel: formatDateLabel(booking.request.startDate, booking.request.endDate),
          priceRub: booking.payment.lineItems.reduce((sum, line) => sum + line.amountRub, 0),
          travelerName: booking.travelerRoster[0]?.displayName,
          status: booking.status,
        })),
        error: null,
      };
    }

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
    return {
      data: seededGuideBookings.map((booking) => ({
        id: booking.id,
        title: booking.request.destination,
        destination: booking.request.destination,
        dateLabel: formatDateLabel(booking.request.startDate, booking.request.endDate),
        priceRub: booking.payment.lineItems.reduce((sum, line) => sum + line.amountRub, 0),
        travelerName: booking.travelerRoster[0]?.displayName,
        status: booking.status,
      })),
      error: makeError(error),
    };
  }
}

export async function getUserFavorites(
  client: SupabaseClient,
  userId: string,
): Promise<QueryResult<FavoriteRecord[]>> {
  try {
    const { data, error } = await client.from("favorites").select("*").eq("user_id", userId);
    if (error) throw error;
    if (!data || data.length === 0) {
      return {
        data: listSeededFavoritesForUser(userId)
          .filter((favorite) => favorite.target.type === "listing")
          .map((favorite) => ({
            id: favorite.id,
            listingSlug: favorite.target.slug,
            createdAt: favorite.createdAt,
          })),
        error: null,
      };
    }

    return {
      data: data.map((favorite) => ({
        id: favorite.id,
        listingSlug: favorite.listing_id,
        createdAt: favorite.created_at,
      })),
      error: null,
    };
  } catch (error) {
    return {
      data: listSeededFavoritesForUser(userId)
        .filter((favorite) => favorite.target.type === "listing")
        .map((favorite) => ({
          id: favorite.id,
          listingSlug: favorite.target.slug,
          createdAt: favorite.createdAt,
        })),
      error: makeError(error),
    };
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
    const fallbackState = !listSeededFavoritesForUser(userId).some(
      (favorite) => favorite.target.type === "listing" && favorite.target.slug === listingId,
    );
    return { data: fallbackState, error: makeError(error) };
  }
}

export async function getListingReviews(client: SupabaseClient, slug: string): Promise<QueryResult<ReviewRecord[]>> {
  try {
    const { data, error } = await client.from("reviews").select("*").eq("target_type", "listing").eq("target_slug", slug);
    if (error) throw error;
    if (!data || data.length === 0) return { data: mapSeedReviews("listing", slug), error: null };
    return { data: data.map(mapReviewRow), error: null };
  } catch (error) {
    return { data: mapSeedReviews("listing", slug), error: makeError(error) };
  }
}

export async function getGuideReviews(client: SupabaseClient, slug: string): Promise<QueryResult<ReviewRecord[]>> {
  try {
    const { data, error } = await client.from("reviews").select("*").eq("target_type", "guide").eq("target_slug", slug);
    if (error) throw error;
    if (!data || data.length === 0) return { data: mapSeedReviews("guide", slug), error: null };
    return { data: data.map(mapReviewRow), error: null };
  } catch (error) {
    return { data: mapSeedReviews("guide", slug), error: makeError(error) };
  }
}

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

function mapSeedReviews(type: "guide" | "listing", slug: string): ReviewRecord[] {
  return listSeededReviewsForTarget(type, slug).map((review) => ({
    id: review.id,
    authorName: review.author.displayName,
    rating: review.rating,
    title: review.title,
    body: review.body,
    createdAt: review.createdAt,
  }));
}

export function getSeededRequestByListing(listingId: string) {
  const listing = getSeededPublicListing(listingId);
  if (!listing) return null;
  return mapRequestSeeds().find((request) => request.destination.toLowerCase().includes(listing.city.toLowerCase()));
}

export function getSeededTravelerRequest(id: string) {
  return getSeededTravelerRequestById(id);
}
