"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getBooking } from "@/lib/supabase/bookings";
import { getReviewForBooking, createReview } from "@/lib/supabase/reviews";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const reviewFormSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(100).optional(),
  body: z.string().trim().max(2000).optional(),
});

export async function submitReview(bookingId: string, formData: FormData) {
  const parsed = reviewFormSchema.safeParse({
    rating: formData.get("rating"),
    title: formData.get("title"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    redirect(`/traveler/bookings/${bookingId}/review?error=invalid`);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  const booking = await getBooking(bookingId);
  if (!booking || booking.traveler_id !== user.id || booking.status !== "completed") {
    redirect(`/traveler/bookings/${bookingId}`);
  }

  const existingReview = await getReviewForBooking(bookingId);
  if (existingReview) {
    redirect(`/traveler/bookings/${bookingId}`);
  }

  await createReview({
    bookingId,
    travelerId: user.id,
    guideId: booking.guide_id,
    listingId: booking.listing_id ?? undefined,
    rating: parsed.data.rating,
    title: parsed.data.title,
    body: parsed.data.body,
  });

  redirect(`/traveler/bookings/${bookingId}?review=success`);
}

