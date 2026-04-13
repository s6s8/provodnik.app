"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ConfirmOrderResult = { ok: true } | { ok: false; error: string };

export async function confirmOrderAction(
  bookingId: string,
): Promise<ConfirmOrderResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Требуется вход в аккаунт" };

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, guide_id, status")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) return { ok: false, error: "Бронирование не найдено" };
  if (booking.guide_id !== user.id) return { ok: false, error: "Нет доступа" };
  if (booking.status !== "awaiting_guide_confirmation")
    return { ok: false, error: "Нельзя подтвердить: некорректный статус" };

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: "confirmed", updated_at: new Date().toISOString() })
    .eq("id", bookingId);

  if (updateError) return { ok: false, error: updateError.message };
  return { ok: true };
}

