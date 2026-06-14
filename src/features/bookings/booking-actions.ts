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

  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", parsed.data);

  if (error) return { error: "Не удалось отменить." };
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
    .select("id, traveler_id, guide_id")
    .eq("id", parsed.data.bookingId)
    .maybeSingle();

  if (error || !booking || booking.traveler_id !== user.id) {
    return { error: "Бронирование не найдено." };
  }

  const thread = await getOrCreateThread(
    "booking",
    booking.id,
    user.id,
    [booking.guide_id],
  );

  return { threadId: thread.id };
}

