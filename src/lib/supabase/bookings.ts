/**
 * bookings.ts — Booking service layer (server-only)
 *
 * All functions use createSupabaseServerClient and must only be called from
 * Server Components or Server Actions. Never import from client components.
 *
 * travelerId is always derived from the authenticated session — never accepted
 * from client input.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BookingRow, GuideOfferRow, GuideProfileRow, TravelerRequestRow, Uuid } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Input type
// ---------------------------------------------------------------------------

export type CreateBookingInput = {
  request_id: Uuid;
  offer_id: Uuid;
  guide_id: Uuid;
  /** Total price in minor units (kopecks). Sourced from the accepted offer. */
  subtotal_minor: number;
};

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export type Booking = BookingRow;

export type BookingWithDetails = BookingRow & {
  guide_profile: (GuideProfileRow & {
    profile: { full_name: string | null; phone: string | null; avatar_url: string | null } | null;
  }) | null;
  traveler_request: Pick<
    TravelerRequestRow,
    "destination" | "starts_on" | "ends_on" | "participants_count"
  > | null;
  guide_offer: Pick<GuideOfferRow, "price_minor" | "currency" | "message"> | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BOOKING_SELECT =
  "id, traveler_id, guide_id, request_id, offer_id, listing_id, status, party_size, starts_at, ends_at, subtotal_minor, deposit_minor, remainder_minor, currency, cancellation_policy_snapshot, meeting_point, created_at, updated_at";

const BOOKING_WITH_DETAILS_SELECT = `
  ${BOOKING_SELECT},
  guide_profile:guide_profiles!guide_id(
    user_id, display_name, bio, rating, completed_tours, is_available,
    regions, languages, specialties, specialization, attestation_status,
    verification_status, verification_notes, payout_account_label,
    years_experience, slug, created_at, updated_at,
    profile:profiles!user_id(full_name, phone, avatar_url)
  ),
  traveler_request:traveler_requests!request_id(
    destination, starts_on, ends_on, participants_count
  ),
  guide_offer:guide_offers!offer_id(
    price_minor, currency, message
  )
`;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Insert a new booking row.
 * travelerId must come from the auth context — never from client input.
 */
export async function createBooking(
  data: CreateBookingInput,
  travelerId: Uuid,
): Promise<Booking> {
  const supabase = await createSupabaseServerClient();

  const { data: row, error } = await supabase
    .from("bookings")
    .insert({
      traveler_id: travelerId,
      guide_id: data.guide_id,
      request_id: data.request_id,
      offer_id: data.offer_id,
      status: "pending" as const,
      subtotal_minor: data.subtotal_minor,
      currency: "RUB",
    })
    .select(BOOKING_SELECT)
    .single();

  if (error) throw error;
  return row as Booking;
}

/**
 * Fetch a single booking by ID with joined guide_profiles, traveler_requests, and guide_offers.
 * Returns null if not found.
 */
export async function getBooking(id: Uuid): Promise<BookingWithDetails | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_WITH_DETAILS_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return (data as BookingWithDetails | null) ?? null;
}

/**
 * Fetch all bookings for a given traveler, ordered by most recently created.
 */
export async function getTravelerBookings(travelerId: Uuid): Promise<Booking[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("traveler_id", travelerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as Booking[]) ?? [];
}
