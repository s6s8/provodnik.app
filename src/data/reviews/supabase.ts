import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ReviewRating, ReviewRecord, ReviewsSummary } from "@/data/reviews/types";
import type { Uuid } from "@/lib/supabase/types";

type ReviewRowResult = {
  id: string;
  booking_id: string;
  traveler_id: string;
  guide_id: string | null;
  listing_id: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
};

type ReviewTargetLookup =
  | { type: "guide"; slug: string; guideId: Uuid }
  | { type: "listing"; slug: string; listingId: Uuid; guideId: Uuid | null };

function clampTo2Decimals(value: number) {
  return Math.round(value * 100) / 100;
}

async function resolveTargetBySlugForServer(
  type: ReviewRecord["target"]["type"],
  slug: string,
): Promise<ReviewTargetLookup | null> {
  const supabase = await createSupabaseServerClient();

  if (type === "guide") {
    const { data, error } = await supabase
      .from("guide_profiles")
      .select("user_id, slug")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return { type, slug, guideId: data.user_id as Uuid };
  }

  const { data, error } = await supabase
    .from("listings")
    .select("id, slug, guide_id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return {
    type,
    slug,
    listingId: data.id as Uuid,
    guideId: (data.guide_id as Uuid | null) ?? null,
  };
}

async function mapRowsToReviewRecords(
  rows: ReviewRowResult[],
  target: ReviewRecord["target"],
): Promise<ReviewRecord[]> {
  if (rows.length === 0) return [];

  const supabase = await createSupabaseServerClient();
  const travelerIds = Array.from(new Set(rows.map((row) => row.traveler_id as Uuid)));
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", travelerIds);

  if (error) throw error;

  const names = new Map<string, string>();
  for (const profile of profiles ?? []) {
    names.set(
      profile.id as string,
      ((profile as { full_name?: string | null }).full_name ||
        (profile as { email?: string | null }).email ||
        "Traveler") as string,
    );
  }

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    author: {
      userId: row.traveler_id,
      displayName: names.get(row.traveler_id) ?? "Traveler",
    },
    target,
    rating: row.rating as ReviewRating,
    title: row.title ?? "Review",
    body: row.body ?? "",
  }));
}

export async function listPublishedReviewsForTargetFromSupabase(
  target: ReviewRecord["target"],
): Promise<ReviewRecord[]> {
  const lookup = await resolveTargetBySlugForServer(target.type, target.slug);
  if (!lookup) return [];

  const supabase = await createSupabaseServerClient();
  const query = supabase
    .from("reviews")
    .select("id, booking_id, traveler_id, guide_id, listing_id, rating, title, body, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const { data, error } =
    lookup.type === "guide"
      ? await query.eq("guide_id", lookup.guideId)
      : await query.eq("listing_id", lookup.listingId);

  if (error) throw error;
  return mapRowsToReviewRecords((data ?? []) as ReviewRowResult[], target);
}

export async function getPublishedReviewsSummaryForTargetFromSupabase(
  target: ReviewRecord["target"],
): Promise<ReviewsSummary | null> {
  const items = await listPublishedReviewsForTargetFromSupabase(target);
  if (items.length === 0) return null;

  const total = items.reduce((sum, item) => sum + item.rating, 0);
  return {
    averageRating: clampTo2Decimals(total / items.length),
    totalReviews: items.length,
    lastReviewAt: items[0]?.createdAt,
  };
}
