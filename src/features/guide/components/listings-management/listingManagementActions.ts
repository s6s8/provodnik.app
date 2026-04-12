"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function bulkSetStatus(
  listingIds: string[],
  status: "active" | "archived",
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  await supabase
    .from("listings")
    .update({ status })
    .in("id", listingIds)
    .eq("guide_id", user.id);
  return { success: true };
}

export async function quickEditTitle(listingId: string, title: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  await supabase
    .from("listings")
    .update({ title: title.trim() })
    .eq("id", listingId)
    .eq("guide_id", user.id);
  return { success: true };
}
