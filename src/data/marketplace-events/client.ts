import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
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
  if (!hasSupabaseEnv()) return;

  try {
    const supabase = createSupabaseBrowserClient();

    await supabase.from("marketplace_events").insert({
      scope: input.scope,
      request_id: input.requestId ?? null,
      booking_id: input.bookingId ?? null,
      dispute_id: input.disputeId ?? null,
      actor_id: input.actorId ?? null,
      event_type: input.eventType,
      summary: input.summary,
      detail: input.detail ?? null,
      payload: input.payload ?? null,
    });
  } catch {
    // Swallow errors to avoid breaking operator flows; this is best-effort logging.
  }
}

