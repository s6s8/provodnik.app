"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { confirmPaymentAgreement } from "@/lib/supabase/payment-agreements";

export async function confirmPaymentAgreementAction(
  bookingId: string,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = z.string().uuid().safeParse(bookingId);
  if (!parsed.success) {
    return { ok: false, error: "Некорректный идентификатор бронирования." };
  }

  const result = await confirmPaymentAgreement(parsed.data);
  if (result.ok) {
    revalidatePath(`/bookings/${parsed.data}`);
  }
  return result;
}
