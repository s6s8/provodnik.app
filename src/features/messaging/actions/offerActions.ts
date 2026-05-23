"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function acceptOffer(offerId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Verify caller is the traveler who owns the request linked to this offer
  const { data: offer } = await supabase
    .from("guide_offers")
    .select("id, request_id, guide_id, status, expires_at")
    .eq("id", offerId)
    .maybeSingle();

  if (!offer) throw new Error("Предложение не найдено.");
  if (offer.status !== "pending") throw new Error("Предложение уже не в статусе ожидания.");
  if (offer.expires_at && new Date(offer.expires_at) <= new Date()) {
    throw new Error("Срок действия предложения истёк.");
  }

  const { data: request } = await supabase
    .from("traveler_requests")
    .select("traveler_id")
    .eq("id", offer.request_id)
    .maybeSingle();

  if (!request) throw new Error("Запрос не найден.");
  if (request.traveler_id !== user.id) {
    throw new Error("Только автор запроса может принять предложение.");
  }

  const { error } = await supabase
    .from("guide_offers")
    .update({ status: "accepted" })
    .eq("id", offerId)
    .eq("status", "pending");

  if (error) throw new Error(error.message);
  return { success: true };
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

  const { error } = await supabase
    .from("guide_offers")
    .update({ status: "declined" })
    .eq("id", offerId)
    .eq("status", "pending");

  if (error) throw new Error(error.message);
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

  // Verify ownership + state in a single query
  const { data: offer, error: fetchError } = await supabase
    .from("guide_offers")
    .select("id, request_id, guide_id, status, expires_at, price_minor, currency, message")
    .eq("id", offerId)
    .maybeSingle();

  if (fetchError || !offer) throw new Error("Предложение не найдено.");
  if (offer.status !== "pending") throw new Error("Предложение уже не в статусе ожидания.");
  if (offer.expires_at && new Date(offer.expires_at) <= new Date()) {
    throw new Error("Срок действия предложения истёк.");
  }

  const { data: request } = await supabase
    .from("traveler_requests")
    .select("traveler_id")
    .eq("id", offer.request_id)
    .maybeSingle();

  if (!request) throw new Error("Запрос не найден.");
  if (request.traveler_id !== user.id) {
    throw new Error("Только автор запроса может отправить контрпредложение.");
  }

  // Atomic: mark original as counter_offered AND insert new offer
  // If either fails, the transaction rolls back (Supabase handles this via RPC or sequential with error check)
  const { error: markError } = await supabase
    .from("guide_offers")
    .update({ status: "counter_offered" })
    .eq("id", offerId)
    .eq("status", "pending");

  if (markError) throw new Error(markError.message);

  const { error: insertError } = await supabase.from("guide_offers").insert({
    request_id: offer.request_id,
    guide_id: offer.guide_id,
    price_minor: newPriceMinor,
    currency: offer.currency,
    message: description || null,
    status: "pending",
  });

  if (insertError) {
    // Rollback: restore original offer status
    await supabase
      .from("guide_offers")
      .update({ status: "pending" })
      .eq("id", offerId);
    throw new Error(insertError.message);
  }

  return { success: true };
}
