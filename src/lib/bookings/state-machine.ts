import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BookingStatus =
  | "pending"
  | "awaiting_guide_confirmation"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "disputed"
  | "no_show";

export const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ["confirmed", "cancelled", "awaiting_guide_confirmation"],
  awaiting_guide_confirmation: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled", "disputed", "no_show"],
  completed: [],
  cancelled: [],
  disputed: ["cancelled"],
  no_show: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return BOOKING_TRANSITIONS[from].includes(to);
}

export async function transitionBooking(
  bookingId: string,
  to: BookingStatus,
  _userId: string,
): Promise<{ id: string; status: BookingStatus }> {
  const supabase = await createSupabaseServerClient();

  // Fetch current status first
  const { data: current, error: fetchError } = await supabase
    .from("bookings")
    .select("id, status")
    .eq("id", bookingId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!current) throw new Error(`Booking not found: ${bookingId}`);

  const from = current.status as BookingStatus;

  if (!canTransition(from, to)) {
    throw new Error(
      `Invalid booking transition: ${from} → ${to}`,
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({ status: to })
    .eq("id", bookingId)
    .select("id, status")
    .single();

  if (updateError) throw updateError;

  return { id: updated.id as string, status: updated.status as BookingStatus };
}
