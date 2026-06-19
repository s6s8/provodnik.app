"use server";

import { revealTravelerName, revealTravelerPhone, type BookingRecord } from "@/data/supabase/queries";
import { transitionBooking, type BookingStatus } from "@/lib/bookings/state-machine";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ConfirmBookingResult =
  | { ok: true; status: BookingStatus }
  | { ok: false; error: string };

export type GuideBookingDetailResult =
  | { ok: true; booking: BookingRecord }
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

export async function noShowBookingAction(
  bookingId: string,
): Promise<ConfirmBookingResult> {
  return transitionAction(bookingId, "no_show", "Не удалось отметить неявку");
}

export async function getGuideBookingDetailAction(
  bookingId: string,
): Promise<GuideBookingDetailResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Требуется вход в аккаунт" };
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, traveler_id, guide_id, meeting_point, starts_at, ends_at, subtotal_minor, status")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError) return { ok: false, error: bookingError.message };
  if (!booking) return { ok: false, error: "Бронирование не найдено" };
  if (booking.guide_id !== user.id) return { ok: false, error: "Нет доступа" };

  let travelerName: string | undefined;
  let travelerPhone: string | null = null;
  try {
    const admin = createSupabaseAdminClient();
    const { data: traveler } = await admin
      .from("profiles")
      .select("full_name, phone")
      .eq("id", booking.traveler_id)
      .maybeSingle();
    travelerName = revealTravelerName(traveler?.full_name, booking.status);
    travelerPhone = revealTravelerPhone(traveler?.phone, booking.status);
  } catch {
    // admin env not configured — traveler contact unavailable
  }

  return {
    ok: true,
    booking: {
      id: booking.id,
      title: booking.meeting_point ?? "Бронирование",
      destination: booking.meeting_point ?? "Маршрут",
      dateLabel: formatDateLabel(booking.starts_at ?? "", booking.ends_at),
      priceRub: Math.round((booking.subtotal_minor ?? 0) / 100),
      travelerName,
      travelerPhone,
      status: booking.status,
    },
  };
}

function formatDateLabel(start: string, end?: string | null) {
  if (!start) return "Дата уточняется";
  const date = new Date(start);
  const fmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  if (!end) return fmt.format(date);
  const endDate = new Date(end);
  if (Number.isNaN(endDate.getTime()) || endDate.toDateString() === date.toDateString()) return fmt.format(date);
  return `${fmt.format(date)} — ${fmt.format(endDate)}`;
}
