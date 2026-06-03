"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notifyNewOffer } from "@/lib/notifications/triggers";
import { getOrCreateThread } from "@/lib/supabase/conversations";
import {
  createGuideOffer,
  hasGuideOffered,
  createOfferInputSchema,
} from "@/lib/supabase/offers";
import type { SubmitOfferResult } from "./actions-types";

export type { SubmitOfferResult } from "./actions-types";

export type LockEnforcementRequest = {
  date_locked?: boolean | null;
  time_locked?: boolean | null;
  starts_on: string;
  start_time: string | null;
  end_time: string | null;
};

type LockEnforcementResult = { ok: true } | { error: string };

const MSK_OFFSET_MS = 3 * 60 * 60 * 1000;

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

  if (args.request.date_locked && startsAt?.date !== args.request.starts_on) {
    return { error: "Турист просит строго эту дату." };
  }

  if (
    args.request.time_locked &&
    (startsAt?.time !== args.request.start_time?.slice(0, 5) ||
      endsAt?.time !== args.request.end_time?.slice(0, 5))
  ) {
    return { error: "Турист просит строго это время." };
  }

  return { ok: true };
}

async function getCurrentUserId(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error("Не авторизован.");
  }

  return user.id;
}

export async function submitOfferAction(
  requestId: string,
  formData: FormData,
): Promise<SubmitOfferResult> {
  try {
    const guideId = await getCurrentUserId();

    // Verification gate. The enum is draft|submitted|approved|rejected; only
    // 'approved' may submit offers. Mirrored by RLS policy guide_offers_insert.
    const supabaseAuth = await createSupabaseServerClient();
    const { data: guideProfile } = await supabaseAuth
      .from("guide_profiles")
      .select("verification_status")
      .eq("user_id", guideId)
      .maybeSingle();

    if (guideProfile?.verification_status !== "approved") {
      return { error: "Доступно после верификации" };
    }

    // Duplicate guard
    const alreadyOffered = await hasGuideOffered(guideId, requestId);
    if (alreadyOffered) {
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
      .select("traveler_id, date_locked, time_locked, starts_on, start_time, end_time")
      .eq("id", requestId)
      .maybeSingle();

    if (!requestRow) {
      return { error: "Заявка не найдена." };
    }

    const lockCheck = await checkOfferAgainstLocks({
      startsAt: parsed.data.starts_at ?? undefined,
      endsAt: parsed.data.ends_at ?? undefined,
      request: requestRow,
    });

    if ("error" in lockCheck) {
      return { error: lockCheck.error };
    }

    const offer = await createGuideOffer(parsed.data, guideId);

    try {
      await notifyNewOffer(requestId, offer.id);
    } catch {
      // Notification delivery must not block offer creation.
    }

    try {
      if (requestRow?.traveler_id && requestRow.traveler_id !== guideId) {
        await getOrCreateThread("offer", offer.id, guideId, [
          requestRow.traveler_id as string,
        ]);
      }
    } catch {
      // Thread creation is best-effort; offer already exists and traveler can
      // still accept it to auto-create a thread later.
    }
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message === "NEXT_REDIRECT" || err.message.startsWith("NEXT_"))
    ) {
      throw err;
    }
    const msg =
      typeof (err as { message?: unknown }).message === "string"
        ? (err as { message: string }).message
        : "Не удалось отправить предложение.";
    return { error: msg };
  }

  return { ok: true };
}
