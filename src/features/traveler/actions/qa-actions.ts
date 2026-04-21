"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getOrCreateOfferQaThread,
  sendQaMessage,
} from "@/lib/supabase/qa-threads";

export async function getOrCreateQaThreadAction(
  offerId: string,
): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return getOrCreateOfferQaThread(offerId, user.id);
}

export async function sendQaMessageAction(
  threadId: string,
  body: string,
  requestId: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  try {
    await sendQaMessage(threadId, user.id, "traveler", body);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "qa_thread_at_limit") throw new Error("Достигнут лимит сообщений (8). Примите предложение, чтобы продолжить.")
    throw new Error("Не удалось отправить сообщение. Попробуйте ещё раз.")
  }
  revalidatePath(`/traveler/requests/${requestId}`);
}
