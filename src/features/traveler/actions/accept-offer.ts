"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function acceptOfferAction(
  offerId: string,
  requestId: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: threadId, error } = await supabase.rpc("accept_offer", {
    p_offer_id: offerId,
    p_traveler_id: user.id,
  });

  if (error) {
    if (error.message.includes("offer_not_found"))
      throw new Error("Предложение не найдено или уже принято");
    if (error.message.includes("unauthorized"))
      throw new Error("Нет доступа к этому запросу");
    throw new Error("Не удалось принять предложение. Попробуйте ещё раз.");
  }

  revalidatePath(`/traveler/requests/${requestId}`);
  revalidatePath("/traveler/requests");
  redirect(`/traveler/chat/${threadId}`);
}
