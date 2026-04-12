"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function acceptOffer(offerId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { error } = await supabase
    .from("guide_offers")
    .update({ status: "accepted" })
    .eq("id", offerId);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function declineOffer(offerId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { error } = await supabase
    .from("guide_offers")
    .update({ status: "declined" })
    .eq("id", offerId);
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
  const { error: markError } = await supabase
    .from("guide_offers")
    .update({ status: "counter_offered" })
    .eq("id", offerId);
  if (markError) throw new Error(markError.message);
  const { data: original, error: fetchError } = await supabase
    .from("guide_offers")
    .select("*")
    .eq("id", offerId)
    .single();
  if (fetchError || !original) throw new Error("Offer not found");
  const { error: insertError } = await supabase.from("guide_offers").insert({
    request_id: original.request_id,
    guide_id: original.guide_id,
    price_minor: newPriceMinor,
    currency: original.currency,
    message: description || null,
    status: "pending",
  });
  if (insertError) throw new Error(insertError.message);
  return { success: true };
}
