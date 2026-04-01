"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
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
      redirect(`/guide/requests/${requestId}?offered=1`);
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

    await createGuideOffer(parsed.data, guideId);
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message === "NEXT_REDIRECT" || err.message.startsWith("NEXT_"))
    ) {
      throw err;
    }
    return {
      error: err instanceof Error ? err.message : "Не удалось отправить предложение.",
    };
  }

  redirect(`/guide/requests/${requestId}?offered=1`);
}
