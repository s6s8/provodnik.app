import { notFound, redirect } from "next/navigation";

import { FavoritesManager } from "@/features/favorites/components/FavoritesManager";
import { flags } from "@/lib/flags";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FavoritesFolderRow, FavoritesItemRow } from "@/lib/supabase/types";

export default async function FavoritesPage() {
  if (!flags.FEATURE_TR_FAVORITES) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: folders } = await supabase
    .from("favorites_folders")
    .select("*, favorites_items(*, listing:listings(id, title, image_url, price_from_minor, region))")
    .eq("user_id", user.id)
    .order("position");

  const normalized = (folders ?? []).map((row) => {
    const { favorites_items: rawItems, ...folder } = row as FavoritesFolderRow & {
      favorites_items:
        | (FavoritesItemRow & {
            listing: {
              id: string;
              title: string;
              image_url: string | null;
              price_from_minor: number;
              region: string | null;
            } | null;
          })[]
        | null;
    };
    const items = (rawItems ?? [])
      .filter((it) => it.listing != null)
      .map((it) => {
        const listing = it.listing as NonNullable<typeof it.listing>;
        return {
          ...it,
          listing: { ...listing, region: listing.region ?? "" },
        };
      })
      .sort((a, b) => (a.added_at < b.added_at ? 1 : -1));
    return { ...folder, items };
  });

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-2xl font-bold">Избранное</h1>
      <FavoritesManager folders={normalized} />
    </div>
  );
}
