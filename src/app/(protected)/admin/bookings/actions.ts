"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/supabase/moderation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function confirmPaymentAction(bookingId: string): Promise<void> {
  await requireAdminSession();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", bookingId);
  if (error) throw new Error("Не удалось подтвердить оплату");
  revalidatePath("/admin/bookings");
}
