"use server";

import { flags } from "@/lib/flags";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createFolder(name: string) {
  if (!flags.FEATURE_TR_FAVORITES) throw new Error("Feature disabled");
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: existing } = await supabase
    .from("favorites_folders")
    .select("position")
    .eq("user_id", user.id)
    .order("position", { ascending: false })
    .limit(1);
  const nextPosition = (existing?.[0]?.position ?? -1) + 1;
  await supabase.from("favorites_folders").insert({ user_id: user.id, name, position: nextPosition });
  return { success: true };
}

export async function deleteFolder(folderId: string) {
  if (!flags.FEATURE_TR_FAVORITES) throw new Error("Feature disabled");
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  await supabase.from("favorites_folders").delete().eq("id", folderId).eq("user_id", user.id);
  return { success: true };
}

export async function addToFolder(folderId: string, listingId: string) {
  if (!flags.FEATURE_TR_FAVORITES) throw new Error("Feature disabled");
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  await supabase.from("favorites_items").upsert({ folder_id: folderId, listing_id: listingId });
  return { success: true };
}

export async function removeFromFolder(folderId: string, listingId: string) {
  if (!flags.FEATURE_TR_FAVORITES) throw new Error("Feature disabled");
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  await supabase.from("favorites_items").delete().eq("folder_id", folderId).eq("listing_id", listingId);
  return { success: true };
}
