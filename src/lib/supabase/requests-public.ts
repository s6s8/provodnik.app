import type { SupabaseClient } from "@supabase/supabase-js";

export type BiddingGuide = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  average_rating: number | null;
  review_count: number | null;
  slug: string | null;
};

/**
 * Privacy-scoped social proof for the public visitor view. Returns the approved
 * guides with a live bid on an OPEN request (the RPC enforces the open_to_join
 * gate). Never throws — returns [] on any error so it can never block the page.
 */
export async function getBiddingGuidesForRequest(
  supabase: SupabaseClient,
  requestId: string,
): Promise<BiddingGuide[]> {
  try {
    const { data } = await supabase.rpc("get_bidding_guides_for_request", {
      p_request_id: requestId,
    });
    return (data ?? []) as BiddingGuide[];
  } catch {
    return [];
  }
}
