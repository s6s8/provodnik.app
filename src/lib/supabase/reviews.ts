import "server-only";

import { z } from "zod";

import { createNotification } from "@/lib/notifications/create-notification";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const uuidSchema = z.string().uuid("Некорректный UUID.");

const optionalTextSchema = (maxLength: number) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    },
    z.string().max(maxLength).optional().nullable(),
  );

const createReviewInputSchema = z.object({
  bookingId: uuidSchema,
  travelerId: uuidSchema,
  guideId: uuidSchema,
  listingId: uuidSchema.optional().nullable(),
  rating: z.number().int().min(1).max(5),
  title: optionalTextSchema(100),
  body: optionalTextSchema(2000),
});

type ReviewRow = {
  id: string;
  booking_id: string;
  traveler_id: string;
  guide_id: string | null;
  listing_id: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  status: "published" | "flagged" | "hidden";
  created_at: string;
  updated_at: string;
};

type BookingRow = {
  id: string;
  traveler_id: string;
  guide_id: string;
  listing_id: string | null;
  status: string;
};

type ReviewWithDetails = ReviewRow & {
  traveler_name: string;
  travelerName: string;
  createdAt: string;
  bookingLabel: string | null;
  booking: {
    id: string;
    status: string;
    created_at: string;
  } | null;
};

function roundRating(value: number) {
  return Math.round(value * 100) / 100;
}

async function getAuthenticatedUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("Пользователь не авторизован.");

  return user.id;
}

async function loadBooking(bookingId: string): Promise<BookingRow | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, traveler_id, guide_id, listing_id, status")
    .eq("id", bookingId)
    .maybeSingle();

  if (error) throw error;
  return (data as BookingRow | null) ?? null;
}

export async function recalculateGuideStats(guideId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("guide_id", guideId)
    .eq("status", "published");

  if (error) throw error;

  const ratings = (data ?? []).map((row) => Number((row as { rating: number }).rating));
  const completedTours = ratings.length;
  const rating =
    completedTours > 0
      ? roundRating(ratings.reduce((sum, current) => sum + current, 0) / completedTours)
      : 0;

  const { error: updateError } = await supabase
    .from("guide_profiles")
    .update({ rating, completed_tours: completedTours })
    .eq("user_id", guideId);

  if (updateError) throw updateError;
}

export async function createReview(data: {
  bookingId: string;
  travelerId: string;
  guideId: string;
  listingId?: string | null;
  rating: number;
  title?: string | null;
  body?: string | null;
}): Promise<ReviewRow> {
  const input = createReviewInputSchema.parse(data);
  const authUserId = await getAuthenticatedUserId();

  if (authUserId !== input.travelerId) {
    throw new Error("Отзыв может оставить только участник поездки.");
  }

  const booking = await loadBooking(input.bookingId);
  if (!booking) {
    throw new Error("Бронирование не найдено.");
  }

  if (booking.traveler_id !== input.travelerId) {
    throw new Error("Отзыв можно оставить только для своей поездки.");
  }

  if (booking.guide_id !== input.guideId) {
    throw new Error("Гид не совпадает с данными бронирования.");
  }

  if (booking.status !== "completed") {
    throw new Error("Отзыв можно оставить только после завершения поездки.");
  }

  if (input.listingId && booking.listing_id && booking.listing_id !== input.listingId) {
    throw new Error("Объявление не совпадает с данными бронирования.");
  }

  const supabase = createSupabaseAdminClient();
  const { data: existingReview, error: existingReviewError } = await supabase
    .from("reviews")
    .select("id")
    .eq("booking_id", input.bookingId)
    .maybeSingle();

  if (existingReviewError) throw existingReviewError;
  if (existingReview) {
    throw new Error("Отзыв по этой поездке уже оставлен.");
  }

  const { data: row, error } = await supabase
    .from("reviews")
    .insert({
      booking_id: input.bookingId,
      traveler_id: input.travelerId,
      guide_id: input.guideId,
      listing_id: input.listingId ?? booking.listing_id ?? null,
      rating: input.rating,
      title: input.title?.trim() || null,
      body: input.body?.trim() || null,
      status: "published",
    })
    .select("id, booking_id, traveler_id, guide_id, listing_id, rating, title, body, status, created_at, updated_at")
    .single();

  if (error) throw error;

  await recalculateGuideStats(input.guideId);

  await createNotification({
    userId: input.guideId,
    kind: "booking_completed",
    title: "Новый отзыв о поездке",
    body: `Путешественник оставил оценку ${input.rating}/5.`,
    href: `/guide/bookings/${input.bookingId}`,
  }).catch(() => {});

  return row as ReviewRow;
}

export async function getReviewForBooking(
  bookingId: string,
): Promise<ReviewRow | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, booking_id, traveler_id, guide_id, listing_id, rating, title, body, status, created_at, updated_at")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return (data as ReviewRow | null) ?? null;
}

async function loadReviewRowsWithDetails(
  rows: ReviewRow[],
): Promise<ReviewWithDetails[]> {
  if (rows.length === 0) return [];

  const supabase = createSupabaseAdminClient();
  const travelerIds = Array.from(new Set(rows.map((row) => row.traveler_id)));
  const bookingIds = Array.from(new Set(rows.map((row) => row.booking_id)));

  const [{ data: profiles, error: profilesError }, { data: bookings, error: bookingsError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", travelerIds),
      supabase
        .from("bookings")
        .select("id, status, created_at")
        .in("id", bookingIds),
    ]);

  if (profilesError) throw profilesError;
  if (bookingsError) throw bookingsError;

  const travelerNameById = new Map(
    (profiles ?? []).map((profile) => [
      (profile as { id: string }).id,
      (profile as { full_name: string | null }).full_name?.trim() || "Путешественник",
    ]),
  );
  const bookingById = new Map(
    (bookings ?? []).map((booking) => [
      (booking as { id: string }).id,
      booking as { id: string; status: string; created_at: string },
    ]),
  );

  return rows.map((row) => ({
    ...row,
    traveler_name: travelerNameById.get(row.traveler_id) ?? "Путешественник",
    travelerName: travelerNameById.get(row.traveler_id) ?? "Путешественник",
    createdAt: row.created_at,
    bookingLabel: bookingById.get(row.booking_id)
      ? `Бронирование · ${bookingById.get(row.booking_id)?.status ?? "завершено"}`
      : null,
    booking: bookingById.get(row.booking_id) ?? null,
  }));
}

export async function getReviewsForGuide(
  guideId: string,
): Promise<ReviewWithDetails[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, booking_id, traveler_id, guide_id, listing_id, rating, title, body, status, created_at, updated_at")
    .eq("guide_id", guideId)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return loadReviewRowsWithDetails((data ?? []) as ReviewRow[]);
}

export async function getReviewsForListing(
  listingId: string,
): Promise<ReviewWithDetails[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, booking_id, traveler_id, guide_id, listing_id, rating, title, body, status, created_at, updated_at")
    .eq("listing_id", listingId)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return loadReviewRowsWithDetails((data ?? []) as ReviewRow[]);
}
