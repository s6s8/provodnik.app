// Barrel for the Supabase query layer.
// Shared types, mappers and helpers live in ./queries-core (re-exported below
// so existing `@/data/supabase/queries` imports keep working unchanged).
// This file holds the domain query functions.
import type { SupabaseClient } from "@supabase/supabase-js";

import { getPublishedTemplateListings } from "./guide-template-listings";
import {
  applyGuideFilters,
  applyListingFilters,
  applyRequestFilters,
  destinationSearchFromSlug,
  fallbackHeroImage,
  fetchMembersForRequests,
  attachGuideDisplayNames,
  fetchProfilesByUserIds,
  formatDateLabel,
  makeError,
  mapGuideRow,
  mapListingRow,
  mapRequestRow,
  PUBLIC_REVIEW_VIEW,
  REVIEW_AUTHOR_FALLBACK,
  titleToCategory,
} from "./queries-core";
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
} from "./queries-core";

export * from "./queries-core";

// Next.js hands dynamic route params percent-encoded, so Cyrillic slugs arrive
// as %D0%B6… and never match the raw DB value. Decode every URL slug at the data
// boundary. Malformed input (a lone %) is passed through untouched. (PRD-001)
// The guide-detail path uses getSlugLookupCandidates instead (it also NFC/NFKD
// normalizes for the RPC); this covers the simpler .eq() lookups.
function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

function isPublicOpenGroupRequest(rec: RequestRecord): boolean {
  if (rec.mode !== "assembly") return false;
  if (rec.capacity == null) return true;
  return rec.capacity - rec.groupSize > 0 || rec.offerCount > 0;
}

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
    const { data, error } = await client.from("destinations").select("*").eq("slug", decodeSlug(slug)).maybeSingle();
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

    const rows = data && data.length > 0 ? await attachGuideDisplayNames(client, data) : [];
    // Excursions published through the live guide UI land in `guide_templates`,
    // which nothing writes into `listings` — so the catalog must read both or it
    // shows only seed rows. See guide-template-listings.ts.
    const templates = await getPublishedTemplateListings(client);
    const records = [...rows.map(mapListingRow), ...templates];

    return { data: applyListingFilters(records, filters), error: null };
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
      .eq("slug", decodeSlug(slug))
      .maybeSingle();
    if (destError) throw destError;
    if (!dest) return { data: [], error: null };

    // Strip PostgREST .or() grammar chars (comma/parens) from interpolated
    // values so a destination name like "Ростов-на-Дону, обл." can't break or
    // inject into the filter (PRD-034).
    const orSafe = (value: string | null) => (value ?? "").replace(/[,()]/g, " ").trim();
    const { data, error } = await client
      .from("listings")
      .select("*")
      .or(`city.ilike.%${orSafe(dest.name)}%,region.ilike.%${orSafe(dest.region)}%`)
      .eq("status", "published");

    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    const rows = await attachGuideDisplayNames(client, data);
    return { data: rows.map(mapListingRow), error: null };
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

    // Without the templates a guide's own profile showed «Готовые экскурсии» as
    // empty even after they published one — the excursion existed, but only in
    // the table no reader looked at.
    const templates = await getPublishedTemplateListings(client, { guideId });
    return { data: [...(data ?? []).map(mapListingRow), ...templates], error: null };
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

    if (data && data.length > 0) {
      const records = data.map((row) => mapRequestRow(row));
      const membersMap = await fetchMembersForRequests(
        db,
        data.map((row) => ({ id: row.id as string, creatorId: row.traveler_id as string })),
      );
      for (const rec of records) {
        rec.members = membersMap.get(rec.id) ?? [];
      }

      return { data: applyRequestFilters(records, filters), error: null };
    }

    // Anonymous visitors cannot read the raw table (RLS requires a session).
    // Fall back to the sanitized public view so logged-out discovery still works.
    const { data: publicRows, error: publicError } = await db
      .from("v_public_open_requests")
      .select("*")
      .in("status", statuses)
      .order("created_at", { ascending: false });

    if (publicError) throw publicError;

    const records = (publicRows ?? []).map((row) => mapRequestRow(row));
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
    const { data: rawData, error } = await db
      .from("traveler_requests")
      .select("*")
      .eq("status", "open")
      .ilike("region", `%${region}%`)
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) throw error;

    // Anonymous visitors cannot read the raw table (RLS); fall back to the
    // sanitized public view for logged-out destination discovery.
    let data = rawData;
    if (!data || data.length === 0) {
      const { data: publicRows, error: publicError } = await db
        .from("v_public_open_requests")
        .select("*")
        .eq("status", "open")
        .ilike("region", `%${region}%`)
        .order("created_at", { ascending: false })
        .limit(12);
      if (publicError) throw publicError;
      data = publicRows ?? [];
    }

    if (data.length === 0) return { data: [], error: null };

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

    // Public-view rows carry no traveler_id (privacy); only resolve creator
    // display data for raw-table rows that expose it.
    const membersMap = await fetchMembersForRequests(
      db,
      data
        .filter((row) => row.traveler_id != null)
        .map((row) => ({ id: row.id as string, creatorId: row.traveler_id as string })),
    );
    for (const rec of records) {
      rec.members = membersMap.get(rec.id) ?? [];
    }

    return { data: records.filter(isPublicOpenGroupRequest), error: null };
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
    const { data: rawData, error } = await db
      .from("traveler_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;

    // Anonymous visitors cannot read the raw table (RLS); fall back to the
    // sanitized public view so logged-out request detail still resolves for
    // open requests. Owner/guide/admin keep full raw-table access above.
    let data = rawData as Record<string, unknown> | null;
    if (!data) {
      const { data: publicRow } = await db
        .from("v_public_open_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      data = (publicRow as Record<string, unknown> | null) ?? null;
    }
    if (!data) return { data: null, error: null };

    const record = mapRequestRow(data);
    const { count: offerCount, error: offerError } = await db
      .from("guide_offers")
      .select("id", { count: "exact", head: true })
      .eq("request_id", id);
    if (offerError) throw offerError;
    record.offerCount = offerCount ?? 0;

    // Public-view rows carry no traveler_id; skip creator resolution for them.
    if (data.traveler_id != null) {
      const membersMap = await fetchMembersForRequests(db, [
        { id, creatorId: data.traveler_id as string },
      ]);
      record.members = membersMap.get(id) ?? [];
    }

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
    // Public guide discovery must include approved/available guides even before
    // they publish their first route. Listing counts are layered below.
    const { data: searchRows, error } = await client.rpc("search_guides", {
      q: filters?.q ?? "",
      p_specializations: (filters?.specializations && filters.specializations.length > 0)
        ? filters.specializations
        : null,
      p_has_listings: false,
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
    // Destination guide blocks should also surface approved guides that have not
    // published listings yet.
    const { data: searchRows, error } = await client.rpc("search_guides", {
      q: "",
      p_region: region,
      p_has_listings: false,
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

function getSlugLookupCandidates(slug: string): string[] {
  const candidates = new Set<string>();
  const add = (value: string) => {
    if (!value) return;
    candidates.add(value);
    candidates.add(value.normalize("NFC"));
    candidates.add(value.normalize("NFKD"));
  };

  add(slug);

  try {
    add(decodeURIComponent(slug));
  } catch {
    // The route param can already be decoded; ignore malformed percent escapes.
  }

  return Array.from(candidates);
}

export async function getGuideBySlug(
  client: SupabaseClient,
  slug: string,
): Promise<QueryResult<GuideRecord>> {
  try {
    const slugCandidates = getSlugLookupCandidates(slug);
    // Anonymous visitors cannot read `profiles` under RLS, so a direct
    // `profiles!inner` join returns nothing and the detail page 404s. Resolve
    // the guide (and its active-account allowlist) through a SECURITY DEFINER
    // RPC that mirrors `search_guides`.
    const { data: rpcRows, error } = await client.rpc("get_public_guide_by_slug", {
      p_slugs: slugCandidates,
    });

    if (error) throw error;
    const data = (Array.isArray(rpcRows) ? rpcRows[0] : rpcRows) as
      | Record<string, unknown>
      | null
      | undefined;
    if (!data) return { data: null, error: null };

    const record = mapGuideRow(data, {
      full_name: data.full_name,
      avatar_url: data.avatar_url,
    });

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
    const { data: listing } = await client.from("listings").select("id").eq("slug", decodeSlug(listingSlug)).maybeSingle();
    if (!listing) return { data: [], error: null };

    const { data, error } = await client
      .from(PUBLIC_REVIEW_VIEW)
      .select("*")
      .eq("listing_id", listing.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    return {
      data: data.map((r) => ({
        id: r.id,
        authorName: (r.author_name as string | null) ?? REVIEW_AUTHOR_FALLBACK,
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
    const { data: gp } = await client.from("guide_profiles").select("user_id").eq("slug", decodeSlug(guideSlug)).maybeSingle();
    if (!gp) return { data: [], error: null };

    const { data, error } = await client
      .from(PUBLIC_REVIEW_VIEW)
      .select("*")
      .eq("guide_id", gp.user_id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    return {
      data: data.map((r) => ({
        id: r.id,
        authorName: (r.author_name as string | null) ?? REVIEW_AUTHOR_FALLBACK,
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

/** Rows scanned per source before dedup — a bound, not a product limit. */
const DESTINATION_SCAN = 2000;
/** Distinct places handed to the client. See the .slice() note below. */
const DESTINATION_SUGGESTIONS = 200;

/**
 * Destination SUGGESTIONS for the request-form combobox — a search vocabulary,
 * not a ranked catalog. Unions published-listing cities/regions with the base
 * city and regions guides declare on their approved profiles, so the field
 * still suggests places even before any excursion is published. Deduped by
 * normalized name+region so casing/whitespace dupes collapse while two places
 * that share a name in different regions stay distinct (the combobox gives each
 * a unique cmdk value). Kept SEPARATE from getActiveGuideDestinations so the
 * homepage «Популярные направления» block keeps its listing-backed guide counts.
 */
export async function getDestinationSuggestions(
  client: SupabaseClient,
): Promise<QueryResult<DestinationOption[]>> {
  try {
    const [listingRes, guideRes] = await Promise.all([
      client
        .from("listings")
        .select("city, region, guide_id")
        .eq("status", "published")
        .not("city", "is", null)
        .limit(DESTINATION_SCAN),
      client
        .from("guide_profiles")
        .select("base_city, regions")
        .eq("verification_status", "approved")
        .limit(DESTINATION_SCAN),
    ]);

    if (listingRes.error) throw listingRes.error;
    if (guideRes.error) throw guideRes.error;

    // Keyed by normalized name+region. First writer wins the display casing;
    // guideCount only tallies distinct guides on listing-backed rows (the
    // combobox never renders the count, so guide-declared places stay at 0).
    const byKey = new Map<string, { name: string; region: string; guides: Set<string> }>();
    const norm = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const add = (name: unknown, region: unknown, guideId?: unknown) => {
      const label = norm(name);
      if (!label) return;
      const regionLabel = norm(region);
      // \u0000 separator: it cannot occur in a place name, so "a\u0000b" and
      // "ab" can never collide. Written as an escape, not a literal NUL -- a raw
      // one makes `file`/grep treat this whole module as binary and skip it.
      const key = `${label.toLocaleLowerCase("ru")}\u0000${regionLabel.toLocaleLowerCase("ru")}`;
      const entry =
        byKey.get(key) ?? { name: label, region: regionLabel, guides: new Set<string>() };
      if (typeof guideId === "string" && guideId) entry.guides.add(guideId);
      byKey.set(key, entry);
    };

    for (const row of listingRes.data ?? []) {
      add(row.city, row.region, row.guide_id);
      add(row.region, row.region); // a listing-only region is suggestible on its own
    }
    for (const row of guideRes.data ?? []) {
      add(row.base_city, row.base_city);
      for (const region of (row.regions as string[] | null) ?? []) {
        add(region, region);
      }
    }

    const result: DestinationOption[] = Array.from(byKey.values())
      .map(({ name, region, guides }) => ({ name, region, guideCount: guides.size }))
      .sort(
        (a, b) =>
          b.guideCount - a.guideCount ||
          a.name.localeCompare(b.name, "ru") ||
          a.region.localeCompare(b.region, "ru"),
      )
      // Every homepage render serializes this whole array into the client payload,
      // and it grows with the roster. Best-covered places win; the field takes free
      // text, so a place outside the shortlist is typed, never blocked.
      .slice(0, DESTINATION_SUGGESTIONS);

    return { data: result, error: null };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}

export async function getHomepageRequests(
  client: SupabaseClient,
): Promise<QueryResult<RequestRecord[]>> {
  try {
    const { data: rawRows, error } = await client
      .from("traveler_requests")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(4);

    if (error) throw error;

    // Anonymous visitors cannot read the raw table (traveler_requests_select
    // requires a session), and the homepage is mostly seen logged out — without
    // this the «Сборные группы» block is empty for every guest. Same fallback as
    // getOpenRequests / getOpenRequestsByDestination; the view is PII-masked.
    let rows = rawRows;
    let fromPublicView = false;
    if (!rows || rows.length === 0) {
      const { data: publicRows, error: publicError } = await client
        .from("v_public_open_requests")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(4);
      if (publicError) throw publicError;
      rows = publicRows ?? [];
      fromPublicView = true;
    }

    if (rows.length === 0) return { data: [], error: null };

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
    // The public view carries no traveler_id — by design, it is the sanitized
    // projection — so there is no creator to resolve and no member avatars to
    // show. Asking anyway sends `id=in.(undefined)` and PostgREST 400s the whole
    // read, which is how the block came back empty rather than just avatar-less.
    if (!fromPublicView) {
      const membersMap = await fetchMembersForRequests(
        client,
        rows.map((row) => ({ id: row.id as string, creatorId: row.traveler_id as string })),
      );
      for (const rec of records) {
        rec.members = membersMap.get(rec.id) ?? [];
      }
    }

    const filtered = records.filter(isPublicOpenGroupRequest);

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
