"use server";

import { transitionBooking, type BookingStatus } from "@/lib/bookings/state-machine";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ConfirmBookingResult =
  | { ok: true; status: BookingStatus }
  | { ok: false; error: string };

export async function confirmBookingAction(
  bookingId: string,
): Promise<ConfirmBookingResult> {
  try {
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

    if (fetchError) {
      return { ok: false, error: fetchError.message };
    }

    if (!booking) {
      return { ok: false, error: "Бронирование не найдено" };
    }

    if (booking.guide_id !== user.id) {
      return { ok: false, error: "Нет доступа" };
    }

    const updated = await transitionBooking(bookingId, "confirmed", user.id);

    return { ok: true, status: updated.status };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось подтвердить бронирование";
    return { ok: false, error: message };
  }
}

export async function confirmBooking(
  bookingId: string,
): Promise<ConfirmBookingResult> {
  return confirmBookingAction(bookingId);
}

export async function completeBookingAction(
  bookingId: string,
): Promise<ConfirmBookingResult> {
  try {
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

    if (fetchError) {
      return { ok: false, error: fetchError.message };
    }

    if (!booking) {
      return { ok: false, error: "Бронирование не найдено" };
    }

    if (booking.guide_id !== user.id) {
      return { ok: false, error: "Нет доступа" };
    }

    const updated = await transitionBooking(bookingId, "completed", user.id);

    return { ok: true, status: updated.status };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось завершить бронирование";
    return { ok: false, error: message };
  }
}

export async function declineBooking(
  bookingId: string,
): Promise<ConfirmBookingResult> {
  try {
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

    if (fetchError) {
      return { ok: false, error: fetchError.message };
    }

    if (!booking) {
      return { ok: false, error: "Бронирование не найдено" };
    }

    if (booking.guide_id !== user.id) {
      return { ok: false, error: "Нет доступа" };
    }

    const updated = await transitionBooking(bookingId, "cancelled", user.id);

    return { ok: true, status: updated.status };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось отклонить бронирование";
    return { ok: false, error: message };
  }
}
