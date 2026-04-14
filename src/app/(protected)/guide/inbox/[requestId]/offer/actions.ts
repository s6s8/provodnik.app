"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notifyNewOffer } from "@/lib/notifications/triggers";
import { getOrCreateThread } from "@/lib/supabase/conversations";
import {
  createGuideOffer,
  hasGuideOffered,
  createOfferInputSchema,
} from "@/lib/supabase/offers";

async function getCurrentUserId(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    throw new Error("Не авторизован.");
  }

  return session.user.id;
}

export type SubmitOfferResult = {
  error?: string;
};

export async function submitOfferAction(
  requestId: string,
  formData: FormData,
): Promise<SubmitOfferResult> {
  try {
    const guideId = await getCurrentUserId();

    // Duplicate guard
    const alreadyOffered = await hasGuideOffered(guideId, requestId);
    if (alreadyOffered) {
      redirect(`/guide/inbox/${requestId}?offered=1`);
    }

    const raw = {
      request_id: requestId,
      price_total: Number(formData.get("price_total")),
      message: String(formData.get("message") ?? ""),
      valid_until: String(formData.get("valid_until") ?? ""),
    };

    const parsed = createOfferInputSchema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return { error: first?.message ?? "Ошибка валидации." };
    }

    const offer = await createGuideOffer(parsed.data, guideId);

    try {
      await notifyNewOffer(requestId, offer.id);
    } catch {
      // Notification delivery must not block offer creation.
    }

    try {
      const supabase = await createSupabaseServerClient();
      const { data: requestRow } = await supabase
        .from("traveler_requests")
        .select("traveler_id")
        .eq("id", requestId)
        .maybeSingle();

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

  redirect(`/guide/inbox/${requestId}?offered=1`);
}
