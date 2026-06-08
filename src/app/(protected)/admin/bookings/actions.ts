"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/supabase/moderation";

export async function confirmPaymentAction(bookingId: string): Promise<void> {
  const { adminClient } = await requireAdminSession();
  const { data, error } = await adminClient
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", bookingId)
    .eq("status", "awaiting_guide_confirmation")
    .select("id, status")
    .maybeSingle();
  if (error) throw new Error("Не удалось подтвердить бронирование");
  if (!data) throw new Error("Бронирование уже обработано или недоступно");
  revalidatePath("/admin/bookings");
}
