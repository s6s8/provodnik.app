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
  await sendQaMessage(threadId, user.id, "traveler", body);
  revalidatePath(`/traveler/requests/${requestId}`);
}
