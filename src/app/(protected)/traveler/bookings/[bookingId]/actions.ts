"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getOrCreateThread } from "@/lib/supabase/conversations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bookingThreadSchema = z.object({
  bookingId: z.string().uuid("Некорректный идентификатор бронирования."),
});

export async function openBookingThreadAction(formData: FormData) {
  const parsed = bookingThreadSchema.safeParse({
    bookingId: formData.get("booking_id"),
  });

  if (!parsed.success) {
    redirect("/messages");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth");
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, traveler_id, guide_id")
    .eq("id", parsed.data.bookingId)
    .maybeSingle();

  if (error || !booking || booking.traveler_id !== user.id) {
    redirect("/messages");
  }

  const thread = await getOrCreateThread(
    "booking",
    booking.id,
    user.id,
    [booking.guide_id],
  );

  redirect(`/messages/${thread.id}`);
}
