"use server";

import { z } from "zod";
import { redirect } from "next/navigation";

import { notifyBookingCreated } from "@/lib/notifications/triggers";
import { getOrCreateThread } from "@/lib/supabase/conversations";
import { createBooking } from "@/lib/supabase/bookings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AcceptOfferActionState = {
  error: string | null;
};

const offerThreadSchema = z.object({
  offerId: z.string().uuid("Некорректный идентификатор предложения."),
});

/**
 * Accept a guide offer:
 * 1. Verifies the current user owns the request.
 * 2. Inserts a booking row.
 * 3. Updates request status → 'booked'.
 * 4. Updates the accepted offer status → 'accepted'.
 * 5. Rejects all other pending offers on this request.
 * 6. Redirects to /traveler/bookings/[bookingId].
 */
export async function acceptOfferAction(
  _prev: AcceptOfferActionState,
  formData: FormData,
): Promise<AcceptOfferActionState> {
  const offerId = formData.get("offer_id") as string | null;
  const requestId = formData.get("request_id") as string | null;
  const guideId = formData.get("guide_id") as string | null;
  const priceMinorRaw = formData.get("price_minor") as string | null;

  if (!offerId || !requestId || !guideId || !priceMinorRaw) {
    return { error: "Недостаточно данных для принятия предложения." };
  }

  const priceMinor = parseInt(priceMinorRaw, 10);
  if (Number.isNaN(priceMinor) || priceMinor < 0) {
    return { error: "Некорректная цена предложения." };
  }

  const supabase = await createSupabaseServerClient();

  // Verify auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Необходима авторизация." };
  }

  // Verify request ownership
  const { data: requestRow, error: reqError } = await supabase
    .from("traveler_requests")
    .select("id, traveler_id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (reqError || !requestRow) {
    return { error: "Запрос не найден." };
  }

  if (requestRow.traveler_id !== user.id) {
    return { error: "Вы не являетесь владельцем этого запроса." };
  }

  if (requestRow.status !== "open") {
    return { error: "Запрос уже не открыт для принятия предложений." };
  }

  // Verify offer belongs to this request
  const { data: offerRow, error: offerError } = await supabase
    .from("guide_offers")
    .select("id, guide_id, request_id, price_minor, status")
    .eq("id", offerId)
    .maybeSingle();

  if (offerError || !offerRow) {
    return { error: "Предложение не найдено." };
  }

  if (offerRow.request_id !== requestId) {
    return { error: "Предложение не относится к этому запросу." };
  }

  if (offerRow.status !== "pending") {
    return { error: "Предложение уже не активно." };
  }

  // Create booking
  let booking: { id: string };
  try {
    booking = await createBooking(
      {
        request_id: requestId,
        offer_id: offerId,
        guide_id: guideId,
        subtotal_minor: priceMinor,
      },
      user.id,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Ошибка создания бронирования.";
    return { error: msg };
  }

  // Update request status → 'booked'
  const { error: updateReqError } = await supabase
    .from("traveler_requests")
    .update({ status: "booked" })
    .eq("id", requestId);

  if (updateReqError) {
    return { error: "Не удалось обновить статус запроса." };
  }

  // Update accepted offer status → 'accepted'
  const { error: updateOfferError } = await supabase
    .from("guide_offers")
    .update({ status: "accepted" })
    .eq("id", offerId);

  if (updateOfferError) {
    return { error: "Не удалось обновить статус предложения." };
  }

  // Reject all other pending offers on this request
  await supabase
    .from("guide_offers")
    .update({ status: "declined" })
    .eq("request_id", requestId)
    .eq("status", "pending")
    .neq("id", offerId);

  try {
    await notifyBookingCreated(booking.id);
  } catch {
    // Notification delivery must not block booking creation.
  }

  redirect(`/traveler/bookings/${booking.id}`);
}

export async function openOfferThreadAction(formData: FormData) {
  const parsed = offerThreadSchema.safeParse({
    offerId: formData.get("offer_id"),
  });

  if (!parsed.success) {
    redirect("/messages");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth");
  }

  const { data: offer, error } = await supabase
    .from("guide_offers")
    .select("id, request_id, guide_id")
    .eq("id", parsed.data.offerId)
    .maybeSingle();

  if (error || !offer) {
    redirect("/messages");
  }

  const { data: request, error: requestError } = await supabase
    .from("traveler_requests")
    .select("traveler_id")
    .eq("id", offer.request_id)
    .maybeSingle();

  if (requestError || !request || request.traveler_id !== user.id) {
    redirect("/messages");
  }

  const thread = await getOrCreateThread("offer", offer.id, user.id, [offer.guide_id]);
  redirect(`/messages/${thread.id}`);
}
