"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { flags } from "@/lib/flags";
import { getBooking } from "@/lib/supabase/bookings";
import { openDispute } from "@/lib/supabase/disputes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const disputeFormSchema = z.object({
  reason: z.string().trim().min(1).max(2000),
  requestedOutcome: z.string().trim().max(2000).optional(),
});

export async function submitDispute(bookingId: string, formData: FormData) {
  if (!flags.FEATURE_TR_DISPUTES) {
    redirect(`/traveler/bookings/${bookingId}`);
  }

  const parsed = disputeFormSchema.safeParse({
    reason: formData.get("reason"),
    requestedOutcome: formData.get("requestedOutcome"),
  });

  if (!parsed.success) {
    redirect(`/traveler/bookings/${bookingId}/dispute?error=invalid`);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  const booking = await getBooking(bookingId);
  if (!booking || booking.traveler_id !== user.id || booking.status !== "confirmed") {
    redirect(`/traveler/bookings/${bookingId}`);
  }

  await openDispute({
    bookingId,
    openedBy: user.id,
    reason: parsed.data.reason,
    requestedOutcome: parsed.data.requestedOutcome,
  });

  redirect(`/traveler/bookings/${bookingId}?dispute=success`);
}

