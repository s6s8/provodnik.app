"use server";

import { recalculateGuideStats } from "@/lib/supabase/reviews";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      booking_id: data.bookingId,
      traveler_id: user.id,
      guide_id: data.guideId,
      listing_id: resolvedListingId,
      rating: data.overall,
      body: data.body.trim(),
      status: "published",
    })
    .select("id")
    .single();

  if (error || !review) throw new Error(error?.message ?? "Failed to submit review");

  const axes: Array<[string, number]> = [
    ["material", data.material],
    ["engagement", data.engagement],
    ["knowledge", data.knowledge],
    ["route", data.route],
  ];

  const { error: breakdownError } = await supabase
    .from("review_ratings_breakdown")
    .insert(
      axes.map(([axis, score]) => ({
        review_id: review.id,
        axis,
        score,
      })),
    );

  if (breakdownError) throw new Error(breakdownError.message);

  await recalculateGuideStats(data.guideId);

  return { reviewId: review.id };
}
