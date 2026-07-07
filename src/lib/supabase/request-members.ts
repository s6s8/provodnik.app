/**
 * request-members.ts — Open request membership service layer (server-only)
 *
 * All functions use createSupabaseServerClient and are intended for Server
 * Components and Server Actions only. Never import this file from client
 * components.
 *
 * travelerId is always derived from the authenticated session — never accepted
 * from client input.
 */

import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { OpenRequestMemberRow, Uuid } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const joinRequestInputSchema = z.object({
  requestId: z.string().uuid("Invalid request ID."),
  travelerId: z.string().uuid("Invalid traveler ID."),
});

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export type RequestMember = {
  travelerId: Uuid;
  displayName: string;
  initials: string;
  avatarUrl: string | null;
  joinedAt: string;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Insert the traveler as a member of the request.
 * Idempotent: if already a member with status=joined, does nothing.
 * If previously left, re-activates the membership.
 */
export async function joinRequest(
  requestId: Uuid,
  travelerId: Uuid,
): Promise<void> {
  const input = joinRequestInputSchema.parse({ requestId, travelerId });

  const supabase = await createSupabaseServerClient();

  // Check for existing row first
  const { data: existing, error: existingError } = await supabase
    .from("open_request_members")
    .select("status, left_at")
    .eq("request_id", input.requestId)
    .eq("traveler_id", input.travelerId)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    const row = existing as Pick<OpenRequestMemberRow, "status" | "left_at">;
    // Already an active member — nothing to do
    if (row.status === "joined" && !row.left_at) return;

    // Previously left — re-activate
    const { error } = await supabase
      .from("open_request_members")
      .update({ status: "joined", left_at: null })
      .eq("request_id", input.requestId)
      .eq("traveler_id", input.travelerId);

    if (error) throw error;
    return;
  }

  // No existing row — insert new membership
  const { error } = await supabase.from("open_request_members").insert({
    request_id: input.requestId,
    traveler_id: input.travelerId,
    status: "joined",
  });

  if (error) throw error;
}

/**
 * Returns true if the given traveler is an active member of the request.
 */
export async function isRequestMember(
  requestId: Uuid,
  travelerId: Uuid,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("open_request_members")
    .select("status, left_at")
    .eq("request_id", requestId)
    .eq("traveler_id", travelerId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return false;
  const row = data as Pick<OpenRequestMemberRow, "status" | "left_at">;
  return row.status === "joined" && !row.left_at;
}
