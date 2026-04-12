"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function submitReplyForReview(replyId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  await supabase
    .from("review_replies")
    .update({
      status: "pending_review",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", replyId)
    .eq("guide_id", user.id);
  return { success: true };
}

export async function saveReplyDraft(reviewId: string, body: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  // Upsert draft reply
  const { data: existing } = await supabase
    .from("review_replies")
    .select("id")
    .eq("review_id", reviewId)
    .eq("guide_id", user.id)
    .single();
  if (existing) {
    await supabase
      .from("review_replies")
      .update({ body, status: "draft" })
      .eq("id", existing.id);
    return { id: existing.id };
  }
  const { data } = await supabase
    .from("review_replies")
    .insert({
      review_id: reviewId,
      guide_id: user.id,
      body,
      status: "draft",
    })
    .select("id")
    .single();
  return { id: data!.id };
}
