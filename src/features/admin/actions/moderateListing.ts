"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PUBLIC_LISTING_STATUS } from "@/lib/supabase/types";

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // JWT fast path
  if (user.app_metadata?.role === "admin") return true;

  // Profile fallback (AP-038 / ERR-096): users created via seed scripts or admin tooling
  // may have profiles.role = 'admin' but no JWT claim.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "admin") return true;

  throw new Error("Forbidden");
}

export async function approveListing(listingId: string) {
  const supabase = await createSupabaseServerClient();
  await verifyAdmin(supabase);

  const { error } = await supabase
    .from("listings")
    .update({ status: PUBLIC_LISTING_STATUS })
    .eq("id", listingId)
    .eq("status", "pending_review");
  if (error) throw new Error("Не удалось одобрить объявление.");
  return { success: true };
}

export async function rejectListing(listingId: string, reason: string) {
  const supabase = await createSupabaseServerClient();
  await verifyAdmin(supabase);

  // The UI already validates this; enforce it here too, since dropping the reason
  // is exactly the bug being fixed and a server action is callable directly.
  const trimmed = reason.trim();
  if (!trimmed) throw new Error("Укажите причину отклонения.");

  const { error } = await supabase
    .from("listings")
    .update({ status: "rejected" })
    .eq("id", listingId)
    .eq("status", "pending_review");
  if (error) throw new Error("Не удалось отклонить объявление.");

  // The reason used to stop here: the argument was named `_reason` and never
  // written, so the guide was told their excursion was rejected but never why.
  //
  // It goes on the moderation event, not on the listing: `listings.rejection_reason`
  // does not exist (types.ts declares a column the schema never had). The
  // tg_log_listing_moderation trigger has already written this transition's row —
  // with reason NULL, since a trigger cannot know it — and the guide may read those
  // rows for their own listing under moderation_events_select. Attach it there.
  //
  // Service-role: the table has INSERT and SELECT policies and no UPDATE policy, so
  // this write is impossible under RLS. Admin is verified above, and this is the
  // same service-role-after-admin-check pattern admin-listings.ts uses.
  const admin = createSupabaseAdminClient();
  const { error: reasonError } = await admin
    .from("listing_moderation_events")
    .update({ reason: trimmed })
    .eq("listing_id", listingId)
    .eq("to_status", "rejected")
    .is("reason", null);

  // The listing IS rejected at this point. Losing the reason is bad, undoing the
  // moderator's decision because of it would be worse.
  if (reasonError) {
    console.error("[rejectListing] reason not recorded", { listingId, error: reasonError });
  }

  return { success: true };
}
