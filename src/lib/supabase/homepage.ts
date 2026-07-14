// Homepage inventory reads (Готовые экскурсии / Гиды / Отзывы).
// The homepage shows a first-time visitor real, moderated inventory only, so
// every read here drops demo + QA-seed accounts before the data reaches the UI.
import type { SupabaseClient } from "@supabase/supabase-js";

import { isDemoEmail } from "@/data/admin-users/guards";

import { getGuides } from "./queries";
import {
  attachGuideDisplayNames,
  getInitials,
  isQaGuideSlug,
  makeError,
  mapListingRow,
  PUBLIC_REVIEW_VIEW,
  REVIEW_AUTHOR_FALLBACK,
  type GuideRecord,
  type ListingRecord,
  type QueryResult,
} from "./queries-core";
import { PUBLIC_LISTING_STATUS } from "./types";

export type HomepageReview = {
  id: string;
  authorName: string;
  authorInitials: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  guideName: string;
  guideSlug: string;
};

export type HomepageInventory = {
  listings: ListingRecord[];
  guides: GuideRecord[];
  reviews: HomepageReview[];
};

const EMPTY: HomepageInventory = { listings: [], guides: [], reviews: [] };

/** Cards per block. The min-count gates live in the UI (HOMEPAGE_MIN). */
const LISTING_CARDS = 3;
const GUIDE_CARDS = 3;
const REVIEW_CARDS = 3;
/** Newest reviews scanned before demo/QA filtering — enough to fill REVIEW_CARDS. */
const REVIEW_SCAN = 24;

type PublicGuide = { slug: string; displayName: string };

/**
 * Demo/seed accounts, by the same predicate the admin console uses
 * (`isDemoEmail` + the `%@example.com` / `%@provodnik.test` filter in
 * admin-users.ts).
 *
 * Caveat worth knowing: `profiles.email` is admin-only under RLS
 * (`profiles_select`), so for an anonymous visitor this query returns nothing.
 * The "qa-" slug prefix (`isQaGuideSlug`) is the publicly-readable half of the
 * exclusion and is what actually keeps seed guides off the anon homepage. Both
 * run; neither is trusted alone.
 */
async function demoUserIds(client: SupabaseClient, userIds: string[]): Promise<Set<string>> {
  const demo = new Set<string>();
  if (userIds.length === 0) return demo;

  const { data } = await client
    .from("profiles")
    .select("id, email")
    .in("id", userIds)
    .or("email.ilike.%@example.com,email.ilike.%@provodnik.test");

  for (const row of data ?? []) {
    if (isDemoEmail(row.email as string | null)) demo.add(row.id as string);
  }
  return demo;
}

/** Approved, non-demo, non-QA guides — the allow-list every block is filtered by. */
async function publicGuides(client: SupabaseClient): Promise<Map<string, PublicGuide>> {
  const { data, error } = await client
    .from("guide_profiles")
    .select("user_id, slug, display_name")
    .eq("verification_status", "approved");
  if (error) throw error;

  const rows = (data ?? []).filter((row) => !isQaGuideSlug(row.slug as string | null));
  const demo = await demoUserIds(
    client,
    rows.map((row) => row.user_id as string),
  );

  const allowed = new Map<string, PublicGuide>();
  for (const row of rows) {
    const userId = row.user_id as string;
    if (demo.has(userId)) continue;
    allowed.set(userId, {
      slug: row.slug as string,
      displayName: (row.display_name as string | null) ?? "Локальный гид",
    });
  }
  return allowed;
}

async function homepageListings(
  client: SupabaseClient,
  allowed: Map<string, PublicGuide>,
): Promise<ListingRecord[]> {
  const { data, error } = await client
    .from("listings")
    .select("*, profiles!listings_guide_id_fkey(full_name, avatar_url)")
    .eq("status", PUBLIC_LISTING_STATUS)
    .order("featured_rank", { ascending: true, nullsFirst: false });
  if (error) throw error;

  const rows = (data ?? []).filter((row) => allowed.has(row.guide_id as string));
  if (rows.length === 0) return [];

  const named = await attachGuideDisplayNames(client, rows);
  return named.map(mapListingRow).slice(0, LISTING_CARDS);
}

async function homepageGuides(
  client: SupabaseClient,
  allowed: Map<string, PublicGuide>,
): Promise<GuideRecord[]> {
  // getGuides() == the /guides catalog: approved + active account + is_available.
  const { data, error } = await getGuides(client);
  if (error) throw error;
  return (data ?? []).filter((guide) => allowed.has(guide.id)).slice(0, GUIDE_CARDS);
}

async function homepageReviews(
  client: SupabaseClient,
  allowed: Map<string, PublicGuide>,
): Promise<HomepageReview[]> {
  // PUBLIC_REVIEW_VIEW, not `reviews` + a profiles join: anon RLS blocks that join, so
  // every card used to read «Путешественник». The view carries the sanitized author
  // name and the demo flag, so no traveler_id ever reaches this layer.
  const { data, error } = await client
    .from(PUBLIC_REVIEW_VIEW)
    .select("id, rating, title, body, created_at, guide_id, author_name, author_is_demo")
    .order("created_at", { ascending: false })
    .limit(REVIEW_SCAN);
  if (error) throw error;

  const rows = (data ?? []).filter((row) => allowed.has(row.guide_id as string));

  const reviews: HomepageReview[] = [];
  for (const row of rows) {
    if (row.author_is_demo) continue;
    const body = ((row.body as string | null) ?? "").trim();
    if (!body) continue;

    const guide = allowed.get(row.guide_id as string)!;
    const authorName = (row.author_name as string | null) ?? REVIEW_AUTHOR_FALLBACK;

    reviews.push({
      id: row.id as string,
      authorName,
      authorInitials: getInitials(authorName),
      rating: (row.rating as number) ?? 5,
      title: (row.title as string | null) ?? "",
      body,
      createdAt: row.created_at as string,
      guideName: guide.displayName,
      guideSlug: guide.slug,
    });
    if (reviews.length === REVIEW_CARDS) break;
  }
  return reviews;
}

/**
 * One read for the homepage inventory blocks. A block that comes back short of
 * its minimum renders nothing (see HOMEPAGE_MIN) — an empty marketplace must
 * look intentional, never broken, so there is no placeholder data anywhere.
 */
export async function getHomepageInventory(
  client: SupabaseClient,
): Promise<QueryResult<HomepageInventory>> {
  try {
    const allowed = await publicGuides(client);
    const [listings, guides, reviews] = await Promise.all([
      homepageListings(client, allowed),
      homepageGuides(client, allowed),
      homepageReviews(client, allowed),
    ]);
    return { data: { listings, guides, reviews }, error: null };
  } catch (error) {
    return { data: EMPTY, error: makeError(error) };
  }
}
