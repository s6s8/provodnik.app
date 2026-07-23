"use server";

import { actionFailure } from "@/lib/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PUBLIC_LISTING_STATUS } from "@/lib/supabase/types";

import type { ModerationListingResult } from "./moderateListing-types";

export type { ModerationListingResult } from "./moderateListing-types";

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, error: "Требуется вход." };
  }

  if (user.app_metadata?.role === "admin") return { ok: true as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "admin") return { ok: true as const };

  return { ok: false as const, error: "Недостаточно прав." };
}

export async function approveListing(listingId: string): Promise<ModerationListingResult> {
  const supabase = await createSupabaseServerClient();
  const adminCheck = await verifyAdmin(supabase);
  if (!adminCheck.ok) return { success: false, error: adminCheck.error };

  const { data: updatedListing, error } = await supabase
    .from("listings")
    .update({ status: PUBLIC_LISTING_STATUS })
    .eq("id", listingId)
    .eq("status", "pending_review")
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      success: false,
      error: actionFailure(error, "Не удалось одобрить объявление.", "approveListing"),
    };
  }
  if (!updatedListing) {
    return {
      success: false,
      error: "Объявление уже обработано.",
      alreadyProcessed: true,
    };
  }
  return { success: true };
}

export async function rejectListing(
  listingId: string,
  reason: string,
): Promise<ModerationListingResult> {
  const supabase = await createSupabaseServerClient();
  const adminCheck = await verifyAdmin(supabase);
  if (!adminCheck.ok) return { success: false, error: adminCheck.error };

  const trimmed = reason.trim();
  if (!trimmed) return { success: false, error: "Укажите причину отклонения." };

  const { data: updatedListing, error } = await supabase
    .from("listings")
    .update({ status: "rejected" })
    .eq("id", listingId)
    .eq("status", "pending_review")
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      success: false,
      error: actionFailure(error, "Не удалось отклонить объявление.", "rejectListing"),
    };
  }
  if (!updatedListing) {
    return {
      success: false,
      error: "Объявление уже обработано.",
      alreadyProcessed: true,
    };
  }

  const admin = createSupabaseAdminClient();
  const { error: reasonError } = await admin
    .from("listing_moderation_events")
    .update({ reason: trimmed })
    .eq("listing_id", listingId)
    .eq("to_status", "rejected")
    .is("reason", null);

  if (reasonError) {
    console.error("[rejectListing] reason not recorded", { listingId, error: reasonError });
  }

  return { success: true };
}
