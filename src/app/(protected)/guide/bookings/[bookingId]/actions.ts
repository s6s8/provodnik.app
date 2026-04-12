"use server";

import { transitionBooking, type BookingStatus } from "@/lib/bookings/state-machine";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ConfirmBookingResult =
  | { ok: true; status: BookingStatus }
  | { ok: false; error: string };

async function assertGuideOwns(
  bookingId: string,
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Требуется вход в аккаунт" };
  }

  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, guide_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (fetchError) return { ok: false, error: fetchError.message };
  if (!booking) return { ok: false, error: "Бронирование не найдено" };
  if (booking.guide_id !== user.id) return { ok: false, error: "Нет доступа" };

  return { ok: true, userId: user.id };
}

async function transitionAction(
  bookingId: string,
  to: BookingStatus,
  errorMessage: string,
): Promise<ConfirmBookingResult> {
  const auth = await assertGuideOwns(bookingId);
  if (!auth.ok) return auth;
  try {
    const updated = await transitionBooking(bookingId, to, auth.userId);
    return { ok: true, status: updated.status };
  } catch (error) {
    const message = error instanceof Error ? error.message : errorMessage;
    return { ok: false, error: message };
  }
}

export async function confirmBookingAction(
  bookingId: string,
): Promise<ConfirmBookingResult> {
  return transitionAction(bookingId, "confirmed", "Не удалось подтвердить бронирование");
}

export async function confirmBooking(
  bookingId: string,
): Promise<ConfirmBookingResult> {
  return confirmBookingAction(bookingId);
}

export async function completeBookingAction(
  bookingId: string,
): Promise<ConfirmBookingResult> {
  return transitionAction(bookingId, "completed", "Не удалось завершить бронирование");
}

export async function declineBooking(
  bookingId: string,
): Promise<ConfirmBookingResult> {
  return transitionAction(bookingId, "cancelled", "Не удалось отклонить бронирование");
}
