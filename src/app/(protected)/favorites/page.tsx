import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { FavoritesManager } from "@/features/favorites/components/FavoritesManager";
import { buildAuthLoginRedirect } from "@/lib/auth/safe-redirect";
import { flags } from "@/lib/flags";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FavoritesFolderRow, FavoritesItemRow } from "@/lib/supabase/types";

export default async function FavoritesPage() {
  if (!flags.FEATURE_TR_FAVORITES) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(buildAuthLoginRedirect("/favorites"));

  const { data: folders } = await supabase
    .from("favorites_folders")
    .select("*, favorites_items(*, listing:listings(id, slug, title, image_url, price_from_minor, region))")
    .eq("user_id", user.id)
    .order("position");

  const normalized = (folders ?? []).map((row) => {
    const { favorites_items: rawItems, ...folder } = row as FavoritesFolderRow & {
      favorites_items:
        | (FavoritesItemRow & {
            listing: {
              id: string;
              slug: string | null;
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
          listing: { ...listing, slug: listing.slug ?? null, region: listing.region ?? "" },
        };
      })
      .sort((a, b) => (a.added_at < b.added_at ? 1 : -1));
    return { ...folder, items };
  });

  return (
    <div className="container space-y-6 py-8">
      <PageHeader title="Избранное" />
      <FavoritesManager folders={normalized} />
    </div>
  );
}
