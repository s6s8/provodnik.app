import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { EventScope } from "@/lib/supabase/types";

type MarketplaceEventInput = {
  scope: EventScope;
  requestId?: string | null;
  bookingId?: string | null;
  disputeId?: string | null;
  actorId?: string | null;
  eventType: string;
  summary: string;
  detail?: string | null;
  payload?: unknown;
};

export async function recordMarketplaceEventFromClient(
  input: MarketplaceEventInput,
): Promise<void> {
  "use server";

  if (!hasSupabaseEnv()) return;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.rpc("record_marketplace_event", {
      p_scope: input.scope,
      p_request_id: input.requestId ?? null,
      p_booking_id: input.bookingId ?? null,
      p_dispute_id: input.disputeId ?? null,
      p_event_type: input.eventType,
      p_summary: input.summary,
      p_detail: input.detail ?? null,
      p_payload: input.payload ?? null,
    });
  } catch {
    // Swallow errors to avoid breaking operator flows; this is best-effort logging.
  }
}

