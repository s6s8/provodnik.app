import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type FunnelEvent =
  | { event_type: "request_created"; scope: "request"; request_id: string; actor_id?: string | null; summary: string; payload?: Record<string, unknown> }
  | { event_type: "bid_placed"; scope: "request"; request_id: string; actor_id?: string | null; summary: string; payload?: Record<string, unknown> }
  | { event_type: "offer_accepted"; scope: "booking"; booking_id: string; actor_id?: string | null; summary: string; payload?: Record<string, unknown> }
  | { event_type: "booking_confirmed"; scope: "booking"; booking_id: string; actor_id?: string | null; summary: string; payload?: Record<string, unknown> };

export async function logFunnelEvent(e: FunnelEvent): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();
    await admin.from("marketplace_events").insert({
      scope: e.scope,
      request_id: "request_id" in e ? e.request_id : null,
      booking_id: "booking_id" in e ? e.booking_id : null,
      actor_id: e.actor_id ?? null,
      event_type: e.event_type,
      summary: e.summary,
      payload: e.payload ?? {},
    });
  } catch {
    // best-effort telemetry — never block the action
  }
}
