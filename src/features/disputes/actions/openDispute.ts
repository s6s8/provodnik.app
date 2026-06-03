"use server";

import { flags } from "@/lib/flags";
import { notifyDisputeOpened } from "@/lib/notifications/triggers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function openDispute(bookingId: string, reason: string) {
  if (!flags.FEATURE_TR_DISPUTES) throw new Error("Feature disabled");
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const trimmed = reason.trim();
  if (!trimmed) throw new Error("Укажите причину спора.");

  const { data, error } = await supabase.rpc("open_dispute", {
    p_booking_id: bookingId,
    p_reason: trimmed,
  });

  if (error) throw error;

  const disputeId =
    typeof data === "string"
      ? data
      : (data as { dispute_id?: string; id?: string } | null)?.dispute_id ??
        (data as { id?: string } | null)?.id;
  if (!disputeId) throw new Error("Не удалось открыть спор.");

  await notifyDisputeOpened(disputeId);

  return { success: true, disputeId };
}
