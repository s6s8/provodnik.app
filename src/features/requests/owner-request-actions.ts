"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { notifyBookingCreated } from "@/lib/notifications/triggers";
import { getOrCreateThread } from "@/lib/supabase/conversations";
import { buildAuthLoginRedirect } from "@/lib/auth/safe-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { markOffersReadForRequest } from "@/lib/supabase/offers";
import { createNotification } from "@/lib/notifications/create-notification";
import { logFunnelEvent } from "@/lib/analytics/marketplace-events";

export type AcceptOfferActionState = {
  error: string | null;
};

const offerThreadSchema = z.object({
  offerId: z.string().uuid("Некорректный идентификатор предложения."),
});

/** Map an accept_offer RPC error to a traveler-facing message. */
function acceptOfferErrorMessage(raw: string | undefined): string {
  if (raw?.includes("offer_not_found")) return "Предложение уже не активно.";
  if (raw?.includes("offer_expired")) return "Срок действия предложения истёк.";
  if (raw?.includes("unauthorized")) return "Вы не являетесь владельцем этого запроса.";
  if (raw?.toLowerCase().includes("account")) return "Ваш аккаунт неактивен — обратитесь в поддержку.";
  return "Не удалось принять предложение. Попробуйте ещё раз.";
}

/**
 * Accept a guide offer through the single canonical authority.
 *
 * All state (guide, price, currency, start, sibling decline, request booked,
 * booking + payment record, thread) is committed atomically inside the
 * accept_offer RPC, which derives guide_id/price from the OFFER row server-side —
 * never from the form. Parallel accepts serialize on the offer row, so exactly one
 * wins. Only the notification and funnel event stay app-side (external effects).
 */
export async function acceptOfferAction(
  _prev: AcceptOfferActionState,
  formData: FormData,
): Promise<AcceptOfferActionState> {
  const parsed = offerThreadSchema.safeParse({ offerId: formData.get("offer_id") });
  if (!parsed.success) {
    return { error: "Некорректный идентификатор предложения." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Необходима авторизация." };
  }

  const { data: bookingId, error: rpcError } = await supabase.rpc("accept_offer", {
    p_offer_id: parsed.data.offerId,
  });

  if (rpcError || !bookingId) {
    return { error: acceptOfferErrorMessage(rpcError?.message) };
  }

  try {
    await notifyBookingCreated(bookingId as string);
  } catch {
    // Notification delivery must not block booking creation.
  }

  await logFunnelEvent({
    event_type: "offer_accepted",
    scope: "booking",
    booking_id: bookingId as string,
    actor_id: user.id,
    summary: "Путешественник принял предложение",
  });

  redirect(`/bookings/${bookingId as string}`);
}

export type RejectOfferActionState = { error: string | null };

export async function markOffersReadAction(requestId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return;
  }

  const { data: requestRow, error: reqError } = await supabase
    .from("traveler_requests")
    .select("id, traveler_id")
    .eq("id", requestId)
    .maybeSingle();

  if (reqError) {
    throw reqError;
  }

  if (!requestRow || requestRow.traveler_id !== user.id) {
    return;
  }

  await markOffersReadForRequest(requestId);
}

export async function rejectOfferAction(
  _prev: RejectOfferActionState,
  formData: FormData,
): Promise<RejectOfferActionState> {
  const offerId = formData.get("offer_id") as string | null;
  const requestId = formData.get("request_id") as string | null;

  if (!offerId || !requestId) {
    return { error: "Недостаточно данных для отклонения предложения." };
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Необходима авторизация." };
  }

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
    return { error: "Запрос уже не открыт." };
  }

  const { data: offerRow, error: offerError } = await supabase
    .from("guide_offers")
    .select("id, request_id, status")
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

  const { error: updateError } = await supabase
    .from("guide_offers")
    .update({ status: "declined" })
    .eq("id", offerId);

  if (updateError) {
    return { error: "Не удалось отклонить предложение." };
  }

  revalidatePath(`/requests/${requestId}`);
  return { error: null };
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
    redirect(buildAuthLoginRedirect("/messages"));
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

const CANCELLABLE_STATUSES = ["open", "booked"] as const; // DB request_status vocab (open=active); NOT the UI status words
const ACTIVE_BOOKING_STATUSES = ["awaiting_guide_confirmation", "confirmed"];

export type CancelRequestActionState = { error: string | null };

export async function cancelRequestAction(
  _prev: CancelRequestActionState,
  formData: FormData,
): Promise<CancelRequestActionState> {
  const requestId = formData.get("request_id") as string | null;
  if (!requestId) return { error: "Идентификатор запроса не указан." };

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Необходима авторизация." };

  const { data: requestRow, error: reqError } = await supabase
    .from("traveler_requests")
    .select("id, traveler_id, status, destination, starts_on")
    .eq("id", requestId)
    .maybeSingle();

  if (reqError || !requestRow) return { error: "Запрос не найден." };
  if (requestRow.traveler_id !== user.id) return { error: "Нет прав на отмену этого запроса." };
  if (!(CANCELLABLE_STATUSES as readonly string[]).includes(requestRow.status)) {
    return { error: "Запрос нельзя отменить в текущем статусе." };
  }

  const { error: updateError } = await supabase
    .from("traveler_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId);

  if (updateError) return { error: "Не удалось отменить запрос." };

  if (requestRow.status === "booked") {
    const { error: bookingUpdateError } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("request_id", requestId)
      .eq("traveler_id", user.id)
      .in("status", ACTIVE_BOOKING_STATUSES);

    if (bookingUpdateError) return { error: "Не удалось отменить связанное бронирование." };
  }

  // Notify guides who submitted offers
  const { data: offers } = await supabase
    .from("guide_offers")
    .select("guide_id")
    .eq("request_id", requestId)
    .in("status", ["pending", "accepted"]);

  if (offers && offers.length > 0) {
    const destination = requestRow.destination ?? "запрос";
    const date = requestRow.starts_on
      ? new Date(requestRow.starts_on).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
      : "";
    const body = [date, destination].filter(Boolean).join(" · ");
    await Promise.allSettled(
      offers.map((o) =>
        createNotification({
          userId: o.guide_id,
          kind: "booking_cancelled",
          title: "Путешественник отменил запрос",
          body,
          href: `/guide/inbox/${requestId}`,
        }),
      ),
    );
  }

  redirect("/trips");
}
