import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { FavoriteRecord, FavoriteTargetType } from "@/data/favorites/types";
import type { Uuid } from "@/lib/supabase/types";

async function resolveTargetId(
  targetType: FavoriteTargetType,
  slug: string,
): Promise<
  | { targetType: "guide"; guideId: Uuid }
  | { targetType: "listing"; listingId: Uuid }
  | null
> {
  const supabase = createSupabaseBrowserClient();

  if (targetType === "guide") {
    const { data, error } = await supabase
      .from("guide_profiles")
      .select("user_id")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return { targetType, guideId: data.user_id as Uuid };
  }

  const { data, error } = await supabase
    .from("listings")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return { targetType, listingId: data.id as Uuid };
}

export async function listFavoritesForCurrentUserFromSupabase(): Promise<
  FavoriteRecord[]
> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return [];

  const { data: favorites, error } = await supabase
    .from("favorites")
    .select("id, user_id, subject, listing_id, guide_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const favoriteRows = (favorites ?? []) as Array<{
    id: string;
    user_id: string;
    subject: FavoriteTargetType;
    listing_id: string | null;
    guide_id: string | null;
    created_at: string;
  }>;

  const listingIds = favoriteRows
    .map((row) => row.listing_id)
    .filter((value): value is string => Boolean(value));
  const guideIds = favoriteRows
    .map((row) => row.guide_id)
    .filter((value): value is string => Boolean(value));

  const [listingResult, guideResult] = await Promise.all([
    listingIds.length
      ? supabase.from("listings").select("id, slug").in("id", listingIds)
      : Promise.resolve({ data: [], error: null }),
    guideIds.length
      ? supabase.from("guide_profiles").select("user_id, slug").in("user_id", guideIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (listingResult.error) throw listingResult.error;
  if (guideResult.error) throw guideResult.error;

  const listingSlugs = new Map(
    (listingResult.data ?? []).map((row) => [row.id as string, row.slug as string]),
  );
  const guideSlugs = new Map(
    (guideResult.data ?? []).map((row) => [row.user_id as string, row.slug as string]),
  );

  return favoriteRows.flatMap((row) => {
    const slug =
      row.subject === "listing"
        ? listingSlugs.get(row.listing_id ?? "")
        : guideSlugs.get(row.guide_id ?? "");

    if (!slug) return [];

    return [
      {
        id: row.id,
        userId: row.user_id,
        createdAt: row.created_at,
        target: {
          type: row.subject,
          slug,
        },
      } satisfies FavoriteRecord,
    ];
  });
}

export async function isFavoriteInSupabase(
  targetType: FavoriteTargetType,
  slug: string,
): Promise<boolean> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return false;

  const target = await resolveTargetId(targetType, slug);
  if (!target) return false;

  const query = supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("subject", targetType);

  const { data, error } =
    target.targetType === "guide"
      ? await query.eq("guide_id", target.guideId).maybeSingle()
      : await query.eq("listing_id", target.listingId).maybeSingle();

  if (error && error.code !== "PGRST116") throw error;
  return Boolean(data);
}

export async function toggleFavoriteInSupabase(
  targetType: FavoriteTargetType,
  slug: string,
): Promise<boolean> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("User must be authenticated to save favorites.");

  const target = await resolveTargetId(targetType, slug);
  if (!target) throw new Error("Favorite target could not be resolved in Supabase.");

  const query = supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("subject", targetType);

  const { data: existing, error: existingError } =
    target.targetType === "guide"
      ? await query.eq("guide_id", target.guideId).maybeSingle()
      : await query.eq("listing_id", target.listingId).maybeSingle();

  if (existingError && existingError.code !== "PGRST116") throw existingError;

  if (existing?.id) {
    const { error: deleteError } = await supabase
      .from("favorites")
      .delete()
      .eq("id", existing.id);

    if (deleteError) throw deleteError;
    return false;
  }

  const insertPayload =
    target.targetType === "guide"
      ? { user_id: user.id, subject: targetType, guide_id: target.guideId }
      : { user_id: user.id, subject: targetType, listing_id: target.listingId };

  const { error: insertError } = await supabase.from("favorites").insert(insertPayload);
  if (insertError) throw insertError;
  return true;
}
