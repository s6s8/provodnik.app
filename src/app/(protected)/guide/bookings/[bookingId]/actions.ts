"use server";

import { revealTravelerName, revealTravelerPhone, type BookingRecord } from "@/data/supabase/queries";
import { transitionBooking, type BookingStatus } from "@/lib/bookings/state-machine";
import { formatRussianDateRange, formatRussianTime } from "@/lib/dates";
import { friendlyError } from "@/lib/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logFunnelEvent } from "@/lib/analytics/marketplace-events";

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

  if (fetchError) {
    console.error("[assertGuideOwns] bookings fetch failed", fetchError);
    return { ok: false, error: friendlyError(fetchError, "Не удалось загрузить бронирование") };
  }
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
    console.error(`[transitionAction] ${to} failed`, error);
    return { ok: false, error: friendlyError(error, errorMessage) };
  }
}

export async function confirmBookingAction(
  bookingId: string,
): Promise<ConfirmBookingResult> {
  const auth = await assertGuideOwns(bookingId);
  if (!auth.ok) return auth;
  try {
    const updated = await transitionBooking(bookingId, "confirmed", auth.userId);
    await logFunnelEvent({
      event_type: "booking_confirmed",
      scope: "booking",
      booking_id: bookingId,
      actor_id: auth.userId,
      summary: "Бронирование подтверждено",
    });
    return { ok: true, status: updated.status };
  } catch (error) {
    console.error("[confirmBookingAction] transition failed", error);
    return { ok: false, error: friendlyError(error, "Не удалось подтвердить бронирование") };
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
    .select(
      "id, traveler_id, guide_id, request_id, meeting_point, starts_at, ends_at, subtotal_minor, party_size, status, traveler_request:traveler_requests!bookings_request_id_fkey(destination)",
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError) {
    console.error("[getGuideBookingDetailAction] bookings fetch failed", bookingError);
    return { ok: false, error: friendlyError(bookingError, "Не удалось загрузить бронирование") };
  }
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

  const travelerRequest = Array.isArray(booking.traveler_request)
    ? booking.traveler_request[0]
    : booking.traveler_request;
  const requestDestination = travelerRequest?.destination ?? null;

  return {
    ok: true,
    booking: {
      id: booking.id,
      title: requestDestination ?? booking.meeting_point ?? "Маршрут",
      destination: requestDestination ?? booking.meeting_point ?? "Маршрут",
      dateLabel: formatBookingDateLabel(booking.starts_at, booking.ends_at),
      timeLabel: formatBookingTimeLabel(booking.starts_at, booking.ends_at),
      partySize: booking.party_size ?? undefined,
      priceRub: Math.round((booking.subtotal_minor ?? 0) / 100),
      travelerName,
      travelerPhone,
      status: booking.status,
    },
  };
}

function formatBookingDateLabel(start: string | null, end?: string | null): string {
  if (!start) return "Дата уточняется";
  const label = formatRussianDateRange(start, end);
  return label || "Дата уточняется";
}

function formatBookingTimeLabel(start: string | null, end?: string | null): string | undefined {
  if (!start) return undefined;
  const startTime = formatRussianTime(start);
  if (!end) return startTime;
  const endTime = formatRussianTime(end);
  if (!endTime || endTime === startTime) return startTime;
  return `${startTime} – ${endTime}`;
}
