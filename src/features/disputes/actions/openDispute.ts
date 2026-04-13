"use server";

import { transitionBooking } from "@/lib/bookings/state-machine";
import { flags } from "@/lib/flags";
import { notifyDisputeOpened } from "@/lib/notifications/triggers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function openDispute(bookingId: string, reason: string) {
  if (!flags.FEATURE_TR_DISPUTES) throw new Error("Feature disabled");
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const trimmed = reason.trim();
  if (!trimmed) throw new Error("Укажите причину спора.");

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, traveler_id, guide_id, status")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError) throw bookingError;
  if (!booking) throw new Error("Бронирование не найдено.");
  if (!["confirmed", "completed"].includes(booking.status)) {
    throw new Error("Спор можно открыть только по подтверждённой или завершённой поездке.");
  }
  if (booking.traveler_id !== user.id && booking.guide_id !== user.id) {
    throw new Error("Спор может открыть только участник бронирования.");
  }

  const { data, error } = await supabase
    .from("disputes")
    .insert({
      booking_id: bookingId,
      opened_by: user.id,
      status: "open",
      reason: trimmed,
      summary: trimmed,
    })
    .select("id")
    .single();

  if (error) throw error;

  if (booking.status === "confirmed") {
    await transitionBooking(booking.id, "disputed", user.id);
  } else {
    const { error: bookingUpdateError } = await supabase
      .from("bookings")
      .update({ status: "disputed" })
      .eq("id", booking.id);
    if (bookingUpdateError) throw bookingUpdateError;
  }

  await notifyDisputeOpened(data.id);

  const { error: eventError } = await supabase.from("dispute_events").insert({
    dispute_id: data.id,
    actor_id: user.id,
    event_type: "dispute_opened",
    payload: { reason: trimmed },
  });
  if (eventError) throw eventError;

  return { success: true, disputeId: data.id };
}
