// Barrel for the Supabase query layer.
// Shared types, mappers and helpers live in ./queries/core (re-exported below
// so existing `@/data/supabase/queries` imports keep working unchanged).
// This file holds the domain query functions.
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  applyGuideFilters,
  applyListingFilters,
  applyRequestFilters,
  destinationSearchFromSlug,
  fallbackHeroImage,
  fetchMembersForRequests,
  fetchProfilesByUserIds,
  formatDateLabel,
  makeError,
  mapGuideRow,
  mapListingRow,
  mapRequestRow,
  titleToCategory,
} from "./queries/core";
import type {
  BookingRecord,
  DestinationCategory,
  DestinationOption,
  DestinationRecord,
  FavoriteRecord,
  GuideFilters,
  GuideRecord,
  ListingFilters,
  ListingRecord,
  PlatformStats,
  QueryResult,
  RequestFilters,
  RequestRecord,
  ReviewRecord,
} from "./queries/core";

export * from "./queries/core";

export async function getDestinations(client: SupabaseClient): Promise<QueryResult<DestinationRecord[]>> {
  try {
    const { data, error } = await client.from("destinations").select("*").order("listing_count", { ascending: false }).limit(12);
    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    return {
      data: data.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        region: row.region ?? "Россия",
        category: (row.category as DestinationCategory | null) ?? titleToCategory(row.name),
        description: row.description ?? "",
        heroImageUrl: row.hero_image_url ?? fallbackHeroImage,
        listingCount: row.listing_count ?? 0,
        guidesCount: row.guides_count ?? 0,
        avgRating: typeof row.rating === "number" ? row.rating : null,
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
        description: data.description ?? "",
        heroImageUrl: data.hero_image_url ?? fallbackHeroImage,
        listingCount: data.listing_count ?? 0,
        guidesCount: data.guides_count ?? 0,
        avgRating: typeof data.rating === "number" ? data.rating : null,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: makeError(error) };
  }
}

export async function getPlatformStats(
  client: SupabaseClient,
): Promise<QueryResult<PlatformStats | null>> {
  try {
    const { data, error } = await client
      .from("platform_stats")
      .select("guides_active, listings_total, trips_total")
      .maybeSingle();
    if (error) throw error;
    if (!data) return { data: null, error: null };
    return {
      data: {
        guidesActive: (data.guides_active as number | null) ?? 0,
        listingsTotal: (data.listings_total as number | null) ?? 0,
        tripsTotal: (data.trips_total as number | null) ?? 0,
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
  client: SupabaseClient,
  filters?: ListingFilters,
): Promise<QueryResult<ListingRecord[]>> {
  try {
    const { data, error } = await client
      .from("listings")
      .select("*, profiles!listings_guide_id_fkey(full_name, avatar_url)")
      .eq("status", "published")
      .order("featured_rank", { ascending: true, nullsFirst: false });

    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    return { data: applyListingFilters(data.map(mapListingRow), filters), error: null };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}

export async function getListingsByDestination(
  client: SupabaseClient,
  slug: string,
): Promise<QueryResult<ListingRecord[]>> {
  try {
    const { data: dest, error: destError } = await client
      .from("destinations")
      .select("name, region")
      .eq("slug", slug)
      .maybeSingle();
    if (destError) throw destError;
    if (!dest) return { data: [], error: null };

    const { data, error } = await client
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
  client: SupabaseClient,
  guideId: string,
): Promise<QueryResult<ListingRecord[]>> {
  try {
    const { data, error } = await client.from("listings").select("*").eq("guide_id", guideId).eq("status", "published");
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
  statuses: string[] = ["open"],
): Promise<QueryResult<RequestRecord[]>> {
  try {
    const db = client;
    const { data, error } = await db
      .from("traveler_requests")
      .select("*")
      .in("status", statuses)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    const records = data.map((row) => mapRequestRow(row));
    const membersMap = await fetchMembersForRequests(
      db,
      data.map((row) => ({ id: row.id as string, creatorId: row.traveler_id as string })),
    );
    for (const rec of records) {
      rec.members = membersMap.get(rec.id) ?? [];
    }

    return { data: applyRequestFilters(records, filters), error: null };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}

export async function getOpenRequestsByDestination(
  client: SupabaseClient,
  region: string,
): Promise<QueryResult<RequestRecord[]>> {
  try {
    const db = client;
    const { data, error } = await db
      .from("traveler_requests")
      .select("*")
      .eq("status", "open")
      .ilike("region", `%${region}%`)
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    const records = data.map((row) => mapRequestRow(row));
    const ids = records.map((r) => r.id);
    const { data: offerRows, error: offerError } = await db
      .from("guide_offers")
      .select("request_id")
      .in("request_id", ids);
    if (offerError) throw offerError;
    const offerCountMap: Record<string, number> = {};
    for (const row of offerRows ?? []) {
      const rid = row.request_id as string;
      offerCountMap[rid] = (offerCountMap[rid] ?? 0) + 1;
    }
    for (const rec of records) rec.offerCount = offerCountMap[rec.id] ?? 0;

    const membersMap = await fetchMembersForRequests(
      db,
      data.map((row) => ({ id: row.id as string, creatorId: row.traveler_id as string })),
    );
    for (const rec of records) {
      rec.members = membersMap.get(rec.id) ?? [];
    }

    return { data: records, error: null };
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
    const { data, error } = await db
      .from("traveler_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { data: null, error: null };

    const record = mapRequestRow(data);
    const { count: offerCount, error: offerError } = await db
      .from("guide_offers")
      .select("id", { count: "exact", head: true })
      .eq("request_id", id);
    if (offerError) throw offerError;
    record.offerCount = offerCount ?? 0;

    const membersMap = await fetchMembersForRequests(db, [{ id, creatorId: data.traveler_id as string }]);
    record.members = membersMap.get(id) ?? [];

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
  client: SupabaseClient,
  filters?: GuideFilters,
): Promise<QueryResult<GuideRecord[]>> {
  try {
    // OPT-001: Push specializations + has_listings filter server-side
    const { data: searchRows, error } = await client.rpc("search_guides", {
      q: filters?.q ?? "",
      p_specializations: (filters?.specializations && filters.specializations.length > 0)
        ? filters.specializations
        : null,
      p_has_listings: true,
    });

    if (error) throw error;
    if (!searchRows || searchRows.length === 0) return { data: [], error: null };

    const rows = searchRows as Record<string, unknown>[];
    const guideIds = rows.map((row) => row.user_id as string);
    const profileMap = await fetchProfilesByUserIds(client, guideIds);

    const { data: listingRows } = await client
      .from("listings")
      .select("guide_id")
      .eq("status", "published")
      .in("guide_id", guideIds);

    const countMap: Record<string, number> = {};
    for (const row of listingRows ?? []) {
      const gid = row.guide_id as string;
      countMap[gid] = (countMap[gid] ?? 0) + 1;
    }

    const { data: statRows } = await client
      .from("v_guide_public_profile")
      .select("user_id, avatar_url, average_rating, review_count, trips_completed, recommend_pct, specialties, languages, response_rate")
      .in("user_id", guideIds);

    const ratingMap = new Map<
      string,
      {
        rating: number;
        reviewCount: number;
        tripsCompleted: number;
        recommendPct: number | null;
        responseRate: number | null;
        specialties: string[];
        languages: string[];
        avatarUrl: string | null;
      }
    >();
    for (const row of statRows ?? []) {
      ratingMap.set(row.user_id as string, {
        rating: (row.average_rating as number | null) ?? 0,
        reviewCount: (row.review_count as number | null) ?? 0,
        tripsCompleted: (row.trips_completed as number | null) ?? 0,
        recommendPct: (row.recommend_pct as number | null) ?? null,
        responseRate: (row.response_rate as number | null) ?? null,
        specialties: (row.specialties as string[] | null) ?? [],
        languages: (row.languages as string[] | null) ?? [],
        avatarUrl: (row.avatar_url as string | null) ?? null,
      });
    }

    return {
      data: applyGuideFilters(
        rows.map((row) => {
          const userId = row.user_id as string;
          const stats = ratingMap.get(userId);
          const base = mapGuideRow(row, profileMap.get(userId) ?? null);
          return {
            ...base,
            listingCount: countMap[userId] ?? 0,
            avatarUrl: stats?.avatarUrl ?? base.avatarUrl ?? undefined,
            rating: stats?.rating ?? 0,
            reviewCount: stats?.reviewCount ?? 0,
            tripsCompleted: stats?.tripsCompleted ?? base.tripsCompleted,
            recommendPct: stats?.recommendPct ?? base.recommendPct,
            responseRate: stats?.responseRate ?? null,
            specialties: stats?.specialties ?? base.specialties,
            languages: stats?.languages ?? base.languages,
            verified: (row.verification_status as string | null) === "approved",
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

export async function getGuidesByDestination(
  client: SupabaseClient,
  region: string,
): Promise<QueryResult<GuideRecord[]>> {
  try {
    // OPT-001: Push region filter + has_listings server-side
    const { data: searchRows, error } = await client.rpc("search_guides", {
      q: "",
      p_region: region,
      p_has_listings: true,
    });

    if (error) throw error;
    if (!searchRows || searchRows.length === 0) return { data: [], error: null };

    // Server-side filtering applied; just sort + limit client-side
    const rows = (searchRows as Record<string, unknown>[])
      .sort((a, b) => ((b.years_experience as number) ?? 0) - ((a.years_experience as number) ?? 0))
      .slice(0, 6);

    if (rows.length === 0) return { data: [], error: null };

    const profileMap = await fetchProfilesByUserIds(
      client,
      rows.map((row) => row.user_id as string),
    );

    const { data: statRows } = await client
      .from("v_guide_public_profile")
      .select("user_id, avatar_url, average_rating, review_count, trips_completed, recommend_pct, specialties, languages, response_rate")
      .in("user_id", rows.map((r) => r.user_id as string));
    const statsMap = new Map<string, Record<string, unknown>>();
    for (const s of statRows ?? []) statsMap.set(s.user_id as string, s);

    return {
      data: rows.map((row) => {
        const uid = row.user_id as string;
        const s = statsMap.get(uid);
        const base = mapGuideRow(row, profileMap.get(uid) ?? null);
        return {
          ...base,
          avatarUrl: (s?.avatar_url as string) ?? base.avatarUrl ?? undefined,
          rating: (s?.average_rating as number | null) ?? 0,
          reviewCount: (s?.review_count as number | null) ?? 0,
          tripsCompleted: (s?.trips_completed as number | null) ?? base.tripsCompleted,
          recommendPct: (s?.recommend_pct as number | null) ?? null,
          specialties: (s?.specialties as string[] | null) ?? base.specialties,
          languages: (s?.languages as string[] | null) ?? base.languages,
          responseRate: (s?.response_rate as number | null) ?? null,
          verified: (row.verification_status as string | null) === "approved",
        };
      }),
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
    const { data, error } = await client
      .from("guide_profiles")
      .select("*, profiles!guide_profiles_user_id_fkey(id, full_name, avatar_url)")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { data: null, error: null };

    const record = mapGuideRow(data, data.profiles as Record<string, unknown> | null);

    const { data: stats } = await client
      .from("v_guide_public_profile")
      .select("average_rating, review_count, trips_completed, recommend_pct, languages, specialties, response_rate")
      .eq("user_id", record.id)
      .maybeSingle();
    record.rating = stats?.average_rating ?? 0;
    record.reviewCount = stats?.review_count ?? 0;
    record.tripsCompleted = stats?.trips_completed ?? 0;
    record.recommendPct = stats?.recommend_pct ?? null;
    record.languages = stats?.languages ?? [];
    record.specialties = stats?.specialties ?? [];
    record.responseRate = (stats?.response_rate as number | null) ?? null;
    record.verified = (data.verification_status as string | null) === "approved";

    return { data: record, error: null };
  } catch (error) {
    return { data: null, error: makeError(error) };
  }
}

export async function getGuideLocationPhotos(
  client: SupabaseClient,
  guideId: string,
): Promise<QueryResult<{ id: string; location_name: string; object_path: string; sort_order: number }[]>> {
  try {
    const { data, error } = await client
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

export async function getListingReviews(client: SupabaseClient, listingSlug: string): Promise<QueryResult<ReviewRecord[]>> {
  try {
    // First resolve listing UUID from slug
    const { data: listing } = await client.from("listings").select("id").eq("slug", listingSlug).maybeSingle();
    if (!listing) return { data: [], error: null };

    const { data, error } = await client
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

export async function getGuideReviews(client: SupabaseClient, guideSlug: string): Promise<QueryResult<ReviewRecord[]>> {
  try {
    // First resolve guide UUID from slug
    const { data: gp } = await client.from("guide_profiles").select("user_id").eq("slug", guideSlug).maybeSingle();
    if (!gp) return { data: [], error: null };

    const { data, error } = await client
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
      .order("created_at", { ascending: false })
      .limit(4);

    if (error) throw error;
    if (!rows || rows.length === 0) return { data: [], error: null };

    const ids = rows.map((r) => r.id as string);

    const { data: offerRows, error: offerError } = await client
      .from("guide_offers")
      .select("request_id")
      .in("request_id", ids);

    if (offerError) throw offerError;

    const countMap: Record<string, number> = {};
    for (const row of offerRows ?? []) {
      countMap[row.request_id as string] = (countMap[row.request_id as string] ?? 0) + 1;
    }

    const records = rows.map((row) => {
      const rec = mapRequestRow(row);
      rec.offerCount = countMap[rec.id] ?? 0;
      return rec;
    });
    const membersMap = await fetchMembersForRequests(
      client,
      rows.map((row) => ({ id: row.id as string, creatorId: row.traveler_id as string })),
    );
    for (const rec of records) {
      rec.members = membersMap.get(rec.id) ?? [];
    }

    const filtered = records.filter((rec) => {
      if (rec.mode !== "assembly") return true;
      if (rec.capacity == null) return true;
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
      .ilike("destination", `%${destinationSearchFromSlug(destinationSlug)}%`)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    const records = data.map((row) => mapRequestRow(row));
    const result = records
      .filter((record) => record.destinationSlug === destinationSlug)
      .slice(0, 3);

    return { data: result, error: null };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}
