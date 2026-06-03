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

type BookingActor = "traveler" | "guide" | "admin";

function canActorTransition(
  actor: BookingActor,
  from: BookingStatus,
  to: BookingStatus,
): boolean {
  if (actor === "admin") return true;

  if (to === "disputed" || to === "cancelled") {
    return actor === "traveler" || actor === "guide";
  }

  if (from === "pending" && to === "awaiting_guide_confirmation") {
    return actor === "traveler";
  }

  return actor === "guide";
}

export async function transitionBooking(
  bookingId: string,
  to: BookingStatus,
  userId: string,
): Promise<{ id: string; status: BookingStatus }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user || user.id !== userId) {
    throw new Error("Нет доступа к изменению статуса бронирования.");
  }

  // Fetch current status first
  const { data: current, error: fetchError } = await supabase
    .from("bookings")
    .select("id, status, traveler_id, guide_id")
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;

  const actor: BookingActor | null =
    profile?.role === "admin"
      ? "admin"
      : current.traveler_id === user.id
        ? "traveler"
        : current.guide_id === user.id
          ? "guide"
          : null;

  if (!actor || !canActorTransition(actor, from, to)) {
    throw new Error("Нет доступа к изменению статуса бронирования.");
  }

  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({ status: to })
    .eq("id", bookingId)
    .eq("status", from)
    .select("id, status")
    .single();

  if (updateError) throw updateError;

  return { id: updated.id as string, status: updated.status as BookingStatus };
}
