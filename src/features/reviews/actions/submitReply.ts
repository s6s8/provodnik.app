"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { replyBodySchema, uuidSchema } from "@/features/reviews/actions/submitReply.schema";

export async function submitReplyForReview(replyId: string, reviewId: string) {
  if (!uuidSchema.safeParse(replyId).success || !uuidSchema.safeParse(reviewId).success) {
    throw new Error("invalid_input");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Verify the reply belongs to this guide AND this review
  const { data: reply } = await supabase
    .from("review_replies")
    .select("id, guide_id, review_id")
    .eq("id", replyId)
    .maybeSingle();

  if (!reply) throw new Error("Ответ не найден.");
  if (reply.guide_id !== user.id) throw new Error("Нет доступа к этому ответу.");
  if (reply.review_id !== reviewId) throw new Error("Ответ не относится к этому отзыву.");

  // Verify the guide owns the booking linked to this review
  const { data: review } = await supabase
    .from("reviews")
    .select("booking_id")
    .eq("id", reviewId)
    .maybeSingle();

  if (review) {
    const { data: booking } = await supabase
      .from("bookings")
      .select("guide_id")
      .eq("id", review.booking_id)
      .maybeSingle();

    if (!booking || booking.guide_id !== user.id) {
      throw new Error("Нет доступа к этому отзыву.");
    }
  }

  const { count, error } = await supabase
    .from("review_replies")
    .update({
      status: "pending_review",
      submitted_at: new Date().toISOString(),
    }, { count: "exact" })
    .eq("id", replyId)
    .eq("guide_id", user.id);

  if (error) throw new Error(error.message);
  if (count !== 1) throw new Error("Ответ не найден или не доступен.");

  return { success: true };
}

export async function saveReplyDraft(reviewId: string, body: string) {
  const bodyResult = replyBodySchema.safeParse(body);
  if (!uuidSchema.safeParse(reviewId).success || !bodyResult.success) {
    throw new Error("invalid_input");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Verify the guide owns the booking linked to this review
  const { data: review } = await supabase
    .from("reviews")
    .select("id, guide_id")
    .eq("id", reviewId)
    .maybeSingle();

  if (!review) throw new Error("Отзыв не найден.");
  if (review.guide_id !== user.id) throw new Error("Нет доступа к этому отзыву.");

  // Upsert draft reply
  const { data: existing } = await supabase
    .from("review_replies")
    .select("id")
    .eq("review_id", reviewId)
    .eq("guide_id", user.id)
    .maybeSingle();

  if (existing) {
    const { count, error } = await supabase
      .from("review_replies")
      .update({ body: bodyResult.data, status: "draft" }, { count: "exact" })
      .eq("id", existing.id)
      .eq("guide_id", user.id);

    if (error) throw new Error(error.message);
    if (count !== 1) throw new Error("Ответ не найден или не доступен.");
    return { id: existing.id };
  }

  const { data, error } = await supabase
    .from("review_replies")
    .insert({
      review_id: reviewId,
      guide_id: user.id,
      body: bodyResult.data,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Не удалось сохранить ответ.");

  return { id: data.id };
}
