"use server";

import { revalidatePath } from "next/cache";
import { rubToKopecks } from "@/data/money";
import { isFlexibleDateFlexibility } from "@/data/request-date-flexibility";
import { actionFailure } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureOfferConversation } from "@/lib/supabase/offer-conversation";
import {
  createGuideOffer,
  findGuideOfferOnRequest,
  createOfferInputSchema,
} from "@/lib/supabase/offers";
import { isGuideIntervalBlocked } from "@/lib/supabase/guide-availability-blocks";
import { logFunnelEvent } from "@/lib/analytics/marketplace-events";
import type { SubmitOfferResult } from "@/features/guide/offer-action-types";

export type { SubmitOfferResult } from "@/features/guide/offer-action-types";

export type LockEnforcementRequest = {
  date_flexibility?: string | null;
  date_locked?: boolean | null;
  time_locked?: boolean | null;
  starts_on: string;
  start_time: string | null;
  end_time: string | null;
};

type LockEnforcementResult = { ok: true } | { error: string };

const MSK_OFFSET_MS = 3 * 60 * 60 * 1000;

const CALENDAR_BLOCKED_ERROR =
  "Этот период закрыт в вашем календаре. Откройте его в профиле или предложите другое время.";

/**
 * Layer B guard: a guide cannot offer a slot that overlaps their own calendar
 * block. Mirrors the guide_offers_insert RLS conjunct so the UI shows a friendly
 * message; the RLS policy is the real boundary against direct-API bypass.
 * Date-less offers (no interval) are never calendar-blocked.
 */
async function calendarBlocks(
  guideId: string,
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
): Promise<boolean> {
  if (!startsAt || !endsAt) return false;
  return isGuideIntervalBlocked(guideId, startsAt, endsAt);
}

function toMoscowIsoParts(value: string | undefined) {
  if (!value) return null;

  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return null;

  const moscowIso = new Date(time + MSK_OFFSET_MS).toISOString();
  return {
    date: moscowIso.slice(0, 10),
    time: moscowIso.slice(11, 16),
  };
}

export async function checkOfferAgainstLocks(args: {
  startsAt: string | undefined;
  endsAt: string | undefined;
  request: LockEnforcementRequest;
}): Promise<LockEnforcementResult> {
  const startsAt = toMoscowIsoParts(args.startsAt);
  const endsAt = toMoscowIsoParts(args.endsAt);

  if (!isFlexibleDateFlexibility(args.request.date_flexibility) && startsAt?.date !== args.request.starts_on) {
    return { error: "Путешественник просит строго эту дату." };
  }

  if (
    !isFlexibleDateFlexibility(args.request.date_flexibility) &&
    args.request.time_locked &&
    (startsAt?.time !== args.request.start_time?.slice(0, 5) ||
      endsAt?.time !== args.request.end_time?.slice(0, 5))
  ) {
    return { error: "Путешественник просит строго это время." };
  }

  return { ok: true };
}

async function getCurrentActiveUserId(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error("Не авторизован.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.account_status && profile.account_status !== "active") {
    throw new Error("Аккаунт заблокирован.");
  }

  return user.id;
}

export async function submitOfferAction(
  requestId: string,
  formData: FormData,
): Promise<SubmitOfferResult> {
  try {
    const guideId = await getCurrentActiveUserId();

    // Verification gate. The enum is draft|submitted|approved|rejected; only
    // 'approved' may submit offers. Mirrored by RLS policy guide_offers_insert.
    const supabaseAuth = await createSupabaseServerClient();
    const { data: guideProfile } = await supabaseAuth
      .from("guide_profiles")
      .select("verification_status, is_available")
      .eq("user_id", guideId)
      .maybeSingle();

    if (guideProfile?.verification_status !== "approved") {
      return { error: "Доступно после верификации" };
    }
    // Paused guides stop taking new work. Mirrored by RLS guide_offers_insert.
    if (guideProfile?.is_available !== true) {
      return {
        error: "Приём заявок приостановлен. Возобновите его в профиле, чтобы откликаться.",
      };
    }

    // Duplicate guard — still ensure the offer conversation exists on retries.
    const existingOffer = await findGuideOfferOnRequest(guideId, requestId);
    if (existingOffer) {
      const { data: existingRequest } = await supabaseAuth
        .from("traveler_requests")
        .select(
          "traveler_id, destination, region, starts_on, start_time, end_time, date_flexibility",
        )
        .eq("id", requestId)
        .maybeSingle();

      if (existingRequest?.traveler_id && existingRequest.traveler_id !== guideId) {
        try {
          await ensureOfferConversation({
            offer: existingOffer,
            guideId,
            travelerId: existingRequest.traveler_id,
            request: existingRequest,
          });
        } catch (conversationError) {
          console.error("[submitOfferAction] offer conversation ensure failed", conversationError);
        }
      }

      return { ok: true, alreadyOffered: true };
    }

    let route_stops: unknown[] = [];
    try {
      const routeStopsRaw = formData.get("route_stops");
      if (routeStopsRaw && typeof routeStopsRaw === "string") route_stops = JSON.parse(routeStopsRaw) as unknown[];
    } catch {
      // malformed JSON — treat as empty
    }
    const durationRaw = formData.get("route_duration_minutes");
    const route_duration_minutes = durationRaw && String(durationRaw) !== "" ? Number(durationRaw) : undefined;

    const startsAtRaw = formData.get("starts_at");
    const endsAtRaw = formData.get("ends_at");
    const starts_at = startsAtRaw && typeof startsAtRaw === "string" ? startsAtRaw : undefined;
    const ends_at = endsAtRaw && typeof endsAtRaw === "string" ? endsAtRaw : undefined;

    let inclusions: string[] = [];
    try {
      const inclusionsRaw = formData.get("inclusions");
      if (inclusionsRaw && typeof inclusionsRaw === "string") {
        const parsedInc = JSON.parse(inclusionsRaw) as unknown;
        if (Array.isArray(parsedInc)) {
          inclusions = parsedInc
            .filter((v): v is string => typeof v === "string")
            .map((v) => v.trim())
            .filter((v) => v.length > 0);
        }
      }
    } catch {
      // malformed JSON — treat as empty
    }

    const capacityRaw = formData.get("capacity");
    const capacity =
      capacityRaw && String(capacityRaw) !== "" ? Number(capacityRaw) : undefined;

    const raw = {
      request_id: requestId,
      price_total: Number(formData.get("price_total")),
      message: String(formData.get("message") ?? ""),
      valid_until: String(formData.get("valid_until") ?? ""),
      route_stops,
      route_duration_minutes,
      starts_at,
      ends_at,
      inclusions,
      capacity,
    };

    const parsed = createOfferInputSchema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return { error: first?.message ?? "Ошибка валидации." };
    }

    const { data: requestRow } = await supabaseAuth
      .from("traveler_requests")
      .select(
        "traveler_id, status, date_locked, time_locked, starts_on, start_time, end_time, date_flexibility, destination, region",
      )
      .eq("id", requestId)
      .maybeSingle();

    if (!requestRow) {
      return { error: "Заявка не найдена." };
    }

    if (requestRow.status !== "open") {
      return { error: "Заявка больше не принимает предложения." };
    }

    const lockCheck = await checkOfferAgainstLocks({
      startsAt: parsed.data.starts_at ?? undefined,
      endsAt: parsed.data.ends_at ?? undefined,
      request: requestRow,
    });

    if ("error" in lockCheck) {
      return { error: lockCheck.error };
    }

    if (await calendarBlocks(guideId, parsed.data.starts_at, parsed.data.ends_at)) {
      return { error: CALENDAR_BLOCKED_ERROR };
    }

    const offer = await createGuideOffer(parsed.data, guideId);

    await logFunnelEvent({
      event_type: "bid_placed",
      scope: "request",
      request_id: requestId,
      actor_id: guideId,
      summary: "Гид отправил предложение",
    });

    try {
      if (requestRow?.traveler_id && requestRow.traveler_id !== guideId) {
        await ensureOfferConversation({
          offer,
          guideId,
          travelerId: requestRow.traveler_id,
          request: requestRow,
        });
      }
    } catch (conversationError) {
      console.error("[submitOfferAction] offer conversation ensure failed", conversationError);
    }
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message === "NEXT_REDIRECT" || err.message.startsWith("NEXT_"))
    ) {
      throw err;
    }
    return {
      error: actionFailure(err, "Не удалось отправить предложение.", "submitOfferAction"),
    };
  }

  return { ok: true };
}

export async function withdrawOfferAction(
  offerId: string,
  requestId: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    const guideId = await getCurrentActiveUserId();
    const supabase = await createSupabaseServerClient();

    const { data: offer } = await supabase
      .from("guide_offers")
      .select("id, guide_id, status, request_id")
      .eq("id", offerId)
      .maybeSingle();

    if (!offer) return { error: "Предложение не найдено." };
    if (offer.guide_id !== guideId) return { error: "Это не ваше предложение." };
    if (offer.status !== "pending") return { error: "Можно отозвать только активное предложение." };

    // The status read above is advisory only: the traveler can accept or decline
    // before this write lands. The `status = pending` filter is the real
    // authority, so exactly one transition wins and the loser reports the conflict.
    const { data: withdrawnOffer, error } = await supabase
      .from("guide_offers")
      .update({ status: "withdrawn" })
      .eq("id", offerId)
      .eq("guide_id", guideId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (error) {
      return {
        error: actionFailure(error, "Не удалось отозвать предложение.", "withdrawOfferAction"),
      };
    }
    if (!withdrawnOffer) return { error: "Можно отозвать только активное предложение." };

    revalidatePath(`/requests/${requestId}`);
    revalidatePath("/guide/inbox");
    return { ok: true };
  } catch (err) {
    return { error: actionFailure(err, "Не удалось отозвать предложение.", "withdrawOfferAction") };
  }
}

export async function editOfferAction(
  offerId: string,
  requestId: string,
  formData: FormData,
): Promise<SubmitOfferResult> {
  try {
    const guideId = await getCurrentActiveUserId();
    const supabase = await createSupabaseServerClient();

    const { data: offer } = await supabase
      .from("guide_offers")
      .select("id, guide_id, status, request_id")
      .eq("id", offerId)
      .maybeSingle();

    if (!offer) return { error: "Предложение не найдено." };
    if (offer.guide_id !== guideId) return { error: "Это не ваше предложение." };
    if (offer.status !== "pending") return { error: "Можно редактировать только активное предложение." };

    let route_stops: unknown[] = [];
    try {
      const routeStopsRaw = formData.get("route_stops");
      if (routeStopsRaw && typeof routeStopsRaw === "string") route_stops = JSON.parse(routeStopsRaw) as unknown[];
    } catch {
      // malformed JSON — treat as empty
    }
    const durationRaw = formData.get("route_duration_minutes");
    const route_duration_minutes = durationRaw && String(durationRaw) !== "" ? Number(durationRaw) : undefined;

    const startsAtRaw = formData.get("starts_at");
    const endsAtRaw = formData.get("ends_at");
    const starts_at = startsAtRaw && typeof startsAtRaw === "string" ? startsAtRaw : undefined;
    const ends_at = endsAtRaw && typeof endsAtRaw === "string" ? endsAtRaw : undefined;

    let inclusions: string[] = [];
    try {
      const inclusionsRaw = formData.get("inclusions");
      if (inclusionsRaw && typeof inclusionsRaw === "string") {
        const parsedInc = JSON.parse(inclusionsRaw) as unknown;
        if (Array.isArray(parsedInc)) {
          inclusions = parsedInc
            .filter((v): v is string => typeof v === "string")
            .map((v) => v.trim())
            .filter((v) => v.length > 0);
        }
      }
    } catch {
      // malformed JSON — treat as empty
    }

    const capacityRaw = formData.get("capacity");
    const capacity =
      capacityRaw && String(capacityRaw) !== "" ? Number(capacityRaw) : undefined;

    const raw = {
      request_id: requestId,
      price_total: Number(formData.get("price_total")),
      message: String(formData.get("message") ?? ""),
      valid_until: String(formData.get("valid_until") ?? ""),
      route_stops,
      route_duration_minutes,
      starts_at,
      ends_at,
      inclusions,
      capacity,
    };

    const parsed = createOfferInputSchema.safeParse(raw);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ошибка валидации." };

    const { data: requestRow } = await supabase
      .from("traveler_requests")
      .select("traveler_id, date_locked, time_locked, starts_on, start_time, end_time, date_flexibility")
      .eq("id", requestId)
      .maybeSingle();
    if (!requestRow) return { error: "Заявка не найдена." };

    const lockCheck = await checkOfferAgainstLocks({
      startsAt: parsed.data.starts_at ?? undefined,
      endsAt: parsed.data.ends_at ?? undefined,
      request: requestRow,
    });
    if ("error" in lockCheck) return { error: lockCheck.error };

    if (await calendarBlocks(guideId, parsed.data.starts_at, parsed.data.ends_at)) {
      return { error: CALENDAR_BLOCKED_ERROR };
    }

    const { data: updatedOffer, error } = await supabase
      .from("guide_offers")
      .update({
        price_minor: rubToKopecks(parsed.data.price_total),
        message: parsed.data.message,
        expires_at: parsed.data.valid_until,
        capacity: parsed.data.capacity,
        inclusions: parsed.data.inclusions,
        route_stops: parsed.data.route_stops,
        route_duration_minutes: parsed.data.route_duration_minutes ?? null,
        starts_at: parsed.data.starts_at ?? null,
        ends_at: parsed.data.ends_at ?? null,
      })
      .eq("id", offerId)
      .eq("guide_id", guideId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (error) {
      return {
        error: actionFailure(error, "Не удалось обновить предложение.", "editOfferAction"),
      };
    }
    if (!updatedOffer) return { error: "Можно редактировать только активное предложение." };

    revalidatePath(`/requests/${requestId}`);
    revalidatePath("/guide/inbox");
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("NEXT_")) throw err;
    return { error: actionFailure(err, "Не удалось обновить предложение.", "editOfferAction") };
  }
}
