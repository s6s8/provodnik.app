"use server";

import { recalculateGuideStats } from "@/lib/supabase/reviews";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ReviewAxis = "material" | "engagement" | "knowledge" | "route";

function validateReviewAxes(axes: Array<[ReviewAxis, number]>) {
  for (const [axis, score] of axes) {
    if (typeof score !== "number" || score < 1 || score > 5 || !Number.isInteger(score)) {
      throw new Error(`Оценка "${axis}" должна быть целым числом от 1 до 5.`);
    }
  }
}

export async function submitReview(data: {
  bookingId: string;
  guideId: string;
  listingId: string;
  overall: number;
  material: number;
  engagement: number;
  knowledge: number;
  route: number;
  body: string;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const axes: Array<[ReviewAxis, number]> = [
    ["material", data.material],
    ["engagement", data.engagement],
    ["knowledge", data.knowledge],
    ["route", data.route],
  ];
  validateReviewAxes(axes);

  const listingId =
    data.listingId && data.listingId.length > 0 ? data.listingId : null;

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, traveler_id, guide_id, listing_id, status")
    .eq("id", data.bookingId)
    .maybeSingle();

  if (bookingError) throw new Error(bookingError.message);
  if (!booking) throw new Error("Бронирование не найдено.");
  if (booking.traveler_id !== user.id) {
    throw new Error("Отзыв может оставить только участник поездки.");
  }
  if (booking.status !== "completed") {
    throw new Error("Отзыв можно оставить только после завершения поездки.");
  }
  if (booking.guide_id !== data.guideId) {
    throw new Error("Гид не совпадает с данными бронирования.");
  }
  if (listingId && booking.listing_id && booking.listing_id !== listingId) {
    throw new Error("Объявление не совпадает с данными бронирования.");
  }

  const { data: existingReview, error: existingError } = await supabase
    .from("reviews")
    .select("id")
    .eq("booking_id", data.bookingId)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);
  if (existingReview) {
    throw new Error("Отзыв по этой поездке уже оставлен.");
  }

  const resolvedListingId = listingId ?? booking.listing_id ?? null;

  const { data: review, error } = await supabase.rpc("submit_review", {
    p_booking_id: data.bookingId,
    p_guide_id: data.guideId,
    p_listing_id: resolvedListingId,
    p_overall: data.overall,
    p_body: data.body.trim(),
    p_material: data.material,
    p_engagement: data.engagement,
    p_knowledge: data.knowledge,
    p_route: data.route,
  });

  if (error || !review) throw new Error(error?.message ?? "Failed to submit review");

  const reviewId =
    typeof review === "string"
      ? review
      : (review as { review_id?: string; id?: string }).review_id ??
        (review as { id?: string }).id;
  if (!reviewId) throw new Error("Failed to submit review");

  await recalculateGuideStats(data.guideId);

  return { reviewId };
}
