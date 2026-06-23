"use server";

import { revalidatePath } from "next/cache";

import { flags } from "@/lib/flags";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PostDisputeMessageResult = { ok: true } | { ok: false; error: string };

const MAX_BODY = 2000;

export async function postDisputeMessage(
  disputeId: string,
  body: string,
): Promise<PostDisputeMessageResult> {
  if (!flags.FEATURE_TR_DISPUTES) {
    return { ok: false, error: "Споры временно недоступны." };
  }

  const trimmed = body.trim();
  if (!trimmed) {
    return { ok: false, error: "Введите текст сообщения." };
  }
  if (trimmed.length > MAX_BODY) {
    return { ok: false, error: "Сообщение слишком длинное." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Войдите, чтобы отправить сообщение." };
  }

  // Re-verify the caller is a party to this dispute's booking (or admin) before acting.
  const { data: dispute, error: disputeError } = await supabase
    .from("disputes")
    .select("id, booking_id")
    .eq("id", disputeId)
    .maybeSingle();
  if (disputeError || !dispute) {
    return { ok: false, error: "Спор не найден." };
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("traveler_id, guide_id")
    .eq("id", dispute.booking_id)
    .maybeSingle();

  let role: "traveler" | "guide" | "admin" | null = null;
  if (booking?.traveler_id === user.id) {
    role = "traveler";
  } else if (booking?.guide_id === user.id) {
    role = "guide";
  } else {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role === "admin") {
      role = "admin";
    }
  }

  if (!role) {
    return { ok: false, error: "Нет доступа к этому спору." };
  }

  const { error: insertError } = await supabase.from("dispute_events").insert({
    dispute_id: disputeId,
    actor_id: user.id,
    event_type: "comment",
    payload: { body: trimmed, role },
  });

  if (insertError) {
    return { ok: false, error: "Не удалось отправить сообщение." };
  }

  revalidatePath(`/disputes/${disputeId}`);
  return { ok: true };
}
