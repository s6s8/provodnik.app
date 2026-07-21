"use server";

import { acceptOfferForTraveler } from "@/lib/supabase/offers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function acceptOffer(offerId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Same single authority as the request-page accept: the RPC verifies ownership,
  // rejects expired/non-pending offers, declines siblings, books the request and
  // creates the booking + payment record atomically — instead of the old
  // offer-only flip that left the request without a booking. The shared helper also
  // fires the guide's booking notification, which this surface used to skip.
  const { bookingId, error } = await acceptOfferForTraveler(offerId);

  if (!bookingId) {
    const raw = error ?? "";
    if (raw.includes("offer_expired")) throw new Error("Срок действия предложения истёк.");
    if (raw.includes("offer_not_found"))
      throw new Error("Предложение уже не в статусе ожидания.");
    if (raw.includes("unauthorized"))
      throw new Error("Только автор запроса может принять предложение.");
    throw new Error(raw || "Не удалось принять предложение.");
  }

  return { success: true, bookingId };
}

export async function declineOffer(offerId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: offer } = await supabase
    .from("guide_offers")
    .select("id, request_id, status")
    .eq("id", offerId)
    .maybeSingle();

  if (!offer) throw new Error("Предложение не найдено.");
  if (offer.status !== "pending") throw new Error("Предложение уже не в статусе ожидания.");

  const { data: request } = await supabase
    .from("traveler_requests")
    .select("traveler_id")
    .eq("id", offer.request_id)
    .maybeSingle();

  if (!request) throw new Error("Запрос не найден.");
  if (request.traveler_id !== user.id) {
    throw new Error("Только автор запроса может отклонить предложение.");
  }

  const { data: updatedOffer, error } = await supabase
    .from("guide_offers")
    .update({ status: "declined" })
    .eq("id", offerId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!updatedOffer) throw new Error("Предложение уже не в статусе ожидания.");
  return { success: true };
}

export async function counterOffer(
  offerId: string,
  newPriceMinor: number,
  description: string,
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.rpc("counter_offer", {
    p_offer_id: offerId,
    p_price_minor: newPriceMinor,
    p_message: description.trim() || null,
  });

  if (error) throw new Error(error.message);

  return { success: true };
}
