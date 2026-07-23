import "server-only";

/**
 * payment-agreements.ts — face-to-face payment agreement service layer (server-only)
 *
 * Every booking carries a written «agreed price + pay-in-person» record. Both
 * the traveler and the guide can confirm it. There is no card/gateway logic —
 * payment happens directly between the parties at the meeting point.
 *
 * All functions use createSupabaseServerClient (RLS-respecting); RLS limits
 * reads/writes to the booking's own parties (traveler/guide) + admins.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Uuid } from "@/lib/supabase/types";

export type PaymentAgreement = {
  id: string;
  bookingId: string;
  agreedTotalMinor: number;
  currency: string;
  method: string;
  travelerConfirmedAt: string | null;
  guideConfirmedAt: string | null;
};

const AGREEMENT_SELECT =
  "id, booking_id, agreed_total_minor, currency, method, traveler_confirmed_at, guide_confirmed_at";

type PaymentAgreementRow = {
  id: string;
  booking_id: string;
  agreed_total_minor: number;
  currency: string;
  method: string;
  traveler_confirmed_at: string | null;
  guide_confirmed_at: string | null;
};

function mapAgreement(row: PaymentAgreementRow): PaymentAgreement {
  return {
    id: row.id,
    bookingId: row.booking_id,
    agreedTotalMinor: row.agreed_total_minor,
    currency: row.currency,
    method: row.method,
    travelerConfirmedAt: row.traveler_confirmed_at,
    guideConfirmedAt: row.guide_confirmed_at,
  };
}

/**
 * Load the payment agreement for a booking. RLS returns null for non-parties.
 */
export async function getPaymentAgreementForBooking(
  bookingId: Uuid,
): Promise<PaymentAgreement | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("payment_agreements")
    .select(AGREEMENT_SELECT)
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapAgreement(data as PaymentAgreementRow);
}

/**
 * Confirm the face-to-face payment agreement on behalf of the caller.
 * The caller's role is derived from the booking parties: the traveler stamps
 * traveler_confirmed_at, the guide stamps guide_confirmed_at. RLS enforces
 * party-only access; non-parties get «Нет доступа».
 */
export async function confirmPaymentAgreement(
  bookingId: Uuid,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Нет доступа" };

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, traveler_id, guide_id")
    .eq("id", bookingId)
    .maybeSingle();
  if (bookingError) return { ok: false, error: bookingError.message };
  if (!booking) return { ok: false, error: "Нет доступа" };
  if (user.id !== booking.traveler_id && user.id !== booking.guide_id) {
    return { ok: false, error: "Нет доступа" };
  }

  const { error: updateError } = await supabase.rpc("confirm_payment_agreement", {
    p_booking_id: bookingId,
  });
  if (updateError) return { ok: false, error: updateError.message };

  return { ok: true };
}
