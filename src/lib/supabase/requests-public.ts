import type { SupabaseClient } from "@supabase/supabase-js";

export type BiddingGuide = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  average_rating: number | null;
  review_count: number | null;
  slug: string | null;
};

export type BiddingGuidesResult = {
  guides: BiddingGuide[];
  loadError: boolean;
};

/**
 * Privacy-scoped social proof for the public visitor view. Returns the approved
 * guides with a live bid on an OPEN request (the RPC enforces the open_to_join
 * gate). Never throws — failures surface `loadError` so the teaser can warn
 * without blocking the page.
 */
export async function getBiddingGuidesForRequest(
  supabase: SupabaseClient,
  requestId: string,
): Promise<BiddingGuidesResult> {
  try {
    const { data, error } = await supabase.rpc("get_bidding_guides_for_request", {
      p_request_id: requestId,
    });
    if (error) return { guides: [], loadError: true };
    return { guides: (data ?? []) as BiddingGuide[], loadError: false };
  } catch {
    return { guides: [], loadError: true };
  }
}
