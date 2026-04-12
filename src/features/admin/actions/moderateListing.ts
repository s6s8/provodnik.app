"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function approveListing(listingId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  // Verify admin role via jwt
  const role = user.user_metadata?.role ?? user.app_metadata?.role;
  if (role !== "admin") throw new Error("Forbidden");

  const { error } = await supabase
    .from("listings")
    .update({ status: "active" })
    .eq("id", listingId)
    .eq("status", "pending_review");
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function rejectListing(listingId: string, _reason: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const role = user.user_metadata?.role ?? user.app_metadata?.role;
  if (role !== "admin") throw new Error("Forbidden");

  const { error } = await supabase
    .from("listings")
    .update({ status: "rejected" })
    .eq("id", listingId)
    .eq("status", "pending_review");
  if (error) throw new Error(error.message);
  return { success: true };
}
