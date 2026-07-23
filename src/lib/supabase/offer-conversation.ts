/**
 * Idempotent offer-thread bootstrap: one dialog per offer with request context,
 * the guide's message, and an offer card. Safe to call on submit retries.
 */

import { kopecksToRub } from "@/data/money";
import { formatRussianDate, formatTimeRange } from "@/lib/dates";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getOrCreateThread } from "@/lib/supabase/conversations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GuideOfferRow } from "@/lib/supabase/types";

export const OFFER_CONVERSATION_OPENING_KEY = "offer_conversation_opening_v1";

export type OfferConversationRequest = {
  destination: string;
  region?: string | null;
  starts_on: string;
  start_time?: string | null;
  end_time?: string | null;
  date_flexibility?: string | null;
};

export type EnsureOfferConversationInput = {
  offer: Pick<
    GuideOfferRow,
    "id" | "price_minor" | "currency" | "message" | "status" | "expires_at"
  >;
  guideId: string;
  travelerId: string;
  request: OfferConversationRequest;
};

function formatRequestDateLabel(request: OfferConversationRequest): string {
  const dateLabel = formatRussianDate(request.starts_on);
  const timeLabel = formatTimeRange(request.start_time, request.end_time);
  if (request.date_flexibility === "few_days") {
    return timeLabel ? `${dateLabel} (гибкая дата, ${timeLabel})` : `${dateLabel} (гибкая дата)`;
  }
  return timeLabel ? `${dateLabel}, ${timeLabel}` : dateLabel;
}

export function formatDestinationLabel(request: OfferConversationRequest): string {
  const region = request.region?.trim();
  if (region) return `${request.destination}, ${region}`;
  return request.destination;
}

export function buildOfferOpeningMetadata(offerId: string) {
  return { opening_key: `${OFFER_CONVERSATION_OPENING_KEY}:${offerId}` };
}

async function hasOfferOpeningMessage(threadId: string, offerId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const openingKey = buildOfferOpeningMetadata(offerId).opening_key;

  const { data, error } = await supabase
    .from("messages")
    .select("id")
    .eq("thread_id", threadId)
    .contains("metadata", { opening_key: openingKey })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}

async function resolveGuideDisplayName(guideId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("v_guide_public_profile")
    .select("full_name")
    .eq("user_id", guideId)
    .maybeSingle();

  if (error) throw error;
  return data?.full_name?.trim() ?? null;
}

export async function ensureOfferConversation(
  input: EnsureOfferConversationInput,
): Promise<{ threadId: string; created: boolean }> {
  const thread = await getOrCreateThread("offer", input.offer.id, input.guideId, [
    input.travelerId,
  ]);

  if (await hasOfferOpeningMessage(thread.id, input.offer.id)) {
    return { threadId: thread.id, created: false };
  }

  const guideName = await resolveGuideDisplayName(input.guideId);
  const destinationLabel = formatDestinationLabel(input.request);
  const dateLabel = formatRequestDateLabel(input.request);
  const openingKey = buildOfferOpeningMetadata(input.offer.id).opening_key;
  const admin = createSupabaseAdminClient();

  const { error: contextError } = await admin.from("messages").insert({
    thread_id: thread.id,
    sender_id: null,
    sender_role: "system",
    body: "Контекст отклика",
    metadata: {
      opening_key: openingKey,
      event_type: "bid_submitted",
      guide_name: guideName ?? undefined,
      listing_title: destinationLabel,
      price: kopecksToRub(input.offer.price_minor),
      date: dateLabel,
    },
  });
  if (contextError) throw contextError;

  const guideMessage = input.offer.message?.trim() ?? "";

  const { error: offerCardError } = await admin.from("messages").insert({
    thread_id: thread.id,
    sender_id: input.guideId,
    sender_role: "guide",
    body: guideMessage,
    metadata: {
      opening_key: openingKey,
      system_event_type: "offer_sent",
      system_event_payload: {
        offer_id: input.offer.id,
        price_minor: input.offer.price_minor,
        currency: input.offer.currency,
        description: guideMessage,
        status: input.offer.status,
        valid_until: input.offer.expires_at,
      },
    },
  });
  if (offerCardError) throw offerCardError;

  return { threadId: thread.id, created: true };
}
