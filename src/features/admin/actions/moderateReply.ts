"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

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

export async function approveReply(replyId: string) {
  const supabase = await createSupabaseServerClient();
  await verifyAdmin(supabase);

  const { error } = await supabase
    .from("review_replies")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", replyId)
    .eq("status", "pending_review");
  if (error) throw new Error("Не удалось опубликовать ответ.");
  return { success: true };
}

export async function rejectReply(replyId: string) {
  const supabase = await createSupabaseServerClient();
  await verifyAdmin(supabase);

  const { error } = await supabase
    .from("review_replies")
    .update({ status: "draft" })
    .eq("id", replyId)
    .eq("status", "pending_review");
  if (error) throw new Error("Не удалось отклонить ответ.");
  return { success: true };
}
