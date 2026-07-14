import "server-only";

import type { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ListingStatusDb, Uuid } from "@/lib/supabase/types";

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

export type GuideListingRow = {
  id: Uuid;
  title: string;
  status: ListingStatusDb;
  created_at: string;
};

/** ponytail: no pagination — the panel is a diagnostic, not a browser. */
export const GUIDE_LISTINGS_LIMIT = 50;

/**
 * Every listing of one guide, in every status (drafts included) — the admin needs
 * this to answer "my excursion is invisible": usually the listing never left `draft`.
 * Service-role client: RLS would otherwise hide the guide's non-public rows.
 */
export async function listGuideListings(
  adminClient: AdminClient,
  guideId: string,
): Promise<GuideListingRow[]> {
  const { data, error } = await adminClient
    .from("listings")
    .select("id, title, status, created_at")
    .eq("guide_id", guideId)
    .order("created_at", { ascending: false })
    .limit(GUIDE_LISTINGS_LIMIT);

  if (error) throw error;

  return (data ?? []) as GuideListingRow[];
}
