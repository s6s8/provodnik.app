import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ReviewRating, ReviewRecord } from "@/data/reviews/types";
import type { Uuid } from "@/lib/supabase/types";

type ReviewTargetLookup =
  | { type: "guide"; slug: string; guideId: Uuid }
  | { type: "listing"; slug: string; listingId: Uuid; guideId: Uuid | null };

type ReviewInsertInput = {
  bookingId: string;
  targetType: ReviewRecord["target"]["type"];
  targetSlug: string;
  rating: ReviewRating;
  title: string;
  body: string;
};

function looksLikeUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function resolveTargetBySlugForBrowser(
  type: ReviewRecord["target"]["type"],
  slug: string,
): Promise<ReviewTargetLookup | null> {
  const supabase = createSupabaseBrowserClient();

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

export async function createReviewInSupabase(
  input: ReviewInsertInput,
): Promise<ReviewRecord> {
  if (!looksLikeUuid(input.bookingId)) {
    throw new Error("Booking is not persisted yet.");
  }

  const target = await resolveTargetBySlugForBrowser(
    input.targetType,
    input.targetSlug,
  );

  if (!target) {
    throw new Error("Review target could not be resolved in Supabase.");
  }

  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("User must be authenticated to submit a review.");

  const payload =
    target.type === "guide"
      ? {
          booking_id: input.bookingId,
          traveler_id: user.id,
          guide_id: target.guideId,
          listing_id: null,
          rating: input.rating,
          title: input.title.trim(),
          body: input.body.trim(),
        }
      : {
          booking_id: input.bookingId,
          traveler_id: user.id,
          guide_id: target.guideId,
          listing_id: target.listingId,
          rating: input.rating,
          title: input.title.trim(),
          body: input.body.trim(),
        };

  const { data, error } = await supabase
    .from("reviews")
    .insert(payload)
    .select("id, booking_id, traveler_id, guide_id, listing_id, rating, title, body, created_at")
    .single();

  if (error) throw error;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: data.id as string,
    createdAt: data.created_at as string,
    author: {
      userId: user.id,
      displayName:
        ((profile as { full_name?: string | null })?.full_name ||
          (profile as { email?: string | null })?.email ||
          "Traveler") as string,
    },
    target: {
      type: input.targetType,
      slug: input.targetSlug,
    },
    rating: data.rating as ReviewRating,
    title: (data.title as string | null) ?? input.title,
    body: (data.body as string | null) ?? input.body,
  };
}
