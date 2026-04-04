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
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

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
  const { data: existing } = await supabase
    .from("open_request_members")
    .select("status, left_at")
    .eq("request_id", input.requestId)
    .eq("traveler_id", input.travelerId)
    .maybeSingle();

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
 * Fetch all active members for a request, with profile info.
 * Returns members sorted by join time ascending.
 */
export async function getRequestMembers(
  requestId: Uuid,
): Promise<RequestMember[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("open_request_members")
    .select(
      "request_id, traveler_id, status, joined_at, left_at, profiles:traveler_id(id, full_name, avatar_url)",
    )
    .eq("request_id", requestId)
    .eq("status", "joined");

  if (error) throw error;
  if (!data) return [];

  return (data as Array<Record<string, unknown>>)
    .filter((row) => !row.left_at)
    .map((row) => {
      const profileRaw = row.profiles as unknown;
      const profile = Array.isArray(profileRaw)
        ? (profileRaw[0] as Record<string, unknown> | undefined)
        : (profileRaw as Record<string, unknown> | null);

      const fullName =
        (profile?.full_name as string | null) ?? "Путешественник";

      return {
        travelerId: row.traveler_id as Uuid,
        displayName: fullName,
        initials: getInitials(fullName),
        avatarUrl: (profile?.avatar_url as string | null) ?? null,
        joinedAt: row.joined_at as string,
      };
    })
    .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
}

/**
 * Returns true if the given traveler is an active member of the request.
 */
export async function isRequestMember(
  requestId: Uuid,
  travelerId: Uuid,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("open_request_members")
    .select("status, left_at")
    .eq("request_id", requestId)
    .eq("traveler_id", travelerId)
    .maybeSingle();

  if (!data) return false;
  const row = data as Pick<OpenRequestMemberRow, "status" | "left_at">;
  return row.status === "joined" && !row.left_at;
}
