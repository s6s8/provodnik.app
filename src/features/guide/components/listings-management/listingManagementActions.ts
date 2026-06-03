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

  const { count, error } = await supabase
    .from("listings")
    .update({ status }, { count: "exact" })
    .in("id", listingIds)
    .eq("guide_id", user.id);

  if (error) throw new Error(error.message);

  if (count !== listingIds.length) {
    return {
      success: false,
      error: `Обновлено ${count} из ${listingIds.length} экскурсий. Некоторые экскурсии не найдены или не принадлежат вам.`,
    };
  }

  return { success: true, count };
}

export async function quickEditTitle(listingId: string, title: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { count, error } = await supabase
    .from("listings")
    .update({ title: title.trim() }, { count: "exact" })
    .eq("id", listingId)
    .eq("guide_id", user.id);

  if (error) throw new Error(error.message);
  if (count !== 1) {
    throw new Error("Экскурсия не найдена или не принадлежит вам.");
  }
  return { success: true };
}
