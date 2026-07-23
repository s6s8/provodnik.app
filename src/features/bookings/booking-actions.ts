"use server";

import { z } from "zod";

import { getOrCreateThread } from "@/lib/supabase/conversations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const CANCELLABLE_STATUSES = ["pending", "awaiting_guide_confirmation", "confirmed"] as const;

export async function cancelBookingAsTravelerAction(bookingId: string) {
  const parsed = z.string().uuid().safeParse(bookingId);
  if (!parsed.success) return { error: "Некорректный идентификатор." };

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Требуется авторизация." };

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, traveler_id, status")
    .eq("id", parsed.data)
    .maybeSingle();

  if (!booking || booking.traveler_id !== user.id) return { error: "Бронирование не найдено." };
  if (!(CANCELLABLE_STATUSES as readonly string[]).includes(booking.status)) {
    return { error: "Это бронирование нельзя отменить." };
  }

  const { error } = await supabase.rpc("cancel_booking_as_traveler", {
    p_booking_id: parsed.data,
  });

  if (error) {
    if (error.message.includes("concurrent_completion")) {
      return { error: "Это бронирование нельзя отменить." };
    }
    if (error.message.includes("not_cancellable")) {
      return { error: "Это бронирование нельзя отменить." };
    }
    return { error: "Не удалось отменить." };
  }
  return { success: true };
}

const bookingThreadSchema = z.object({
  bookingId: z.string().uuid("Некорректный идентификатор бронирования."),
});

export async function openBookingThreadAction(formData: FormData) {
  const parsed = bookingThreadSchema.safeParse({
    bookingId: formData.get("booking_id"),
  });

  if (!parsed.success) {
    return { error: "Некорректный идентификатор бронирования." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Требуется авторизация." };
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, traveler_id, guide_id, request_id")
    .eq("id", parsed.data.bookingId)
    .maybeSingle();

  if (error || !booking || booking.traveler_id !== user.id) {
    return { error: "Бронирование не найдено." };
  }

  if (booking.request_id) {
    const { data: requestRow, error: requestError } = await supabase
      .from("traveler_requests")
      .select("traveler_id")
      .eq("id", booking.request_id)
      .maybeSingle();
    if (requestError || requestRow?.traveler_id !== user.id) {
      return { error: "Только автор запроса может писать гиду." };
    }
  }

  const thread = await getOrCreateThread(
    "booking",
    booking.id,
    user.id,
    [booking.guide_id],
  );

  return { threadId: thread.id };
}

