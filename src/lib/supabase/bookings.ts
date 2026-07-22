import "server-only";

/**
 * bookings.ts — Booking service layer (server-only)
 *
 * All functions use createSupabaseServerClient and must only be called from
 * Server Components or Server Actions. Never import from client components.
 *
 * travelerId is always derived from the authenticated session — never accepted
 * from client input.
 */

import * as Sentry from "@sentry/nextjs";

import { hasSupabaseAdminEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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
  /** Number of people. When omitted, derived from the request's participants_count. */
  party_size?: number;
  /** Accepted guide offer start datetime. Persisted so confirmed views do not fall back to TBD. */
  starts_at?: string | null;
  /** Accepted guide offer end datetime. */
  ends_at?: string | null;
  /** Accepted offer meeting point, when provided by the guide. */
  meeting_point?: string | null;
};

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export type Booking = BookingRow;

export type BookingWithDetails = BookingRow & {
  guide_profile: (GuideProfileRow & {
    profile: { full_name: string | null; phone: string | null; avatar_url: string | null } | null;
  }) | null;
  /**
   * Guide phone, revealed ONLY to the booking's own traveler (off-platform handoff).
   * Null for any other viewer or when not yet resolvable.
   */
  guide_phone: string | null;
  /**
   * true ONLY when the admin guide-contact query returned an error, so the UI
   * can tell "guide has no phone on file" apart from "we failed to load it".
   */
  guide_contact_error: boolean;
  traveler_request: (Pick<
    TravelerRequestRow,
    | "destination"
    | "starts_on"
    | "ends_on"
    | "participants_count"
    | "notes"
    | "interests"
    | "start_time"
    | "end_time"
    | "format_preference"
    | "open_to_join"
    // A ready guide excursion has no `listings` row, so this snapshot is the only
    // programme a booking made from one can show.
    | "guide_template_snapshot"
  > & { traveler_id?: string | null }) | null;
  guide_offer: Pick<
    GuideOfferRow,
    "price_minor" | "currency" | "message" | "title" | "inclusions" | "capacity" | "starts_at" | "ends_at"
  > | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BOOKING_SELECT =
  "id, traveler_id, guide_id, request_id, offer_id, listing_id, status, party_size, starts_at, ends_at, subtotal_minor, deposit_minor, remainder_minor, currency, cancellation_policy_snapshot, meeting_point, payment_method, payment_status, created_at, updated_at";

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

  let partySize = data.party_size;
  if (partySize === undefined && data.request_id) {
    const { data: request, error: requestError } = await supabase
      .from("traveler_requests")
      .select("participants_count")
      .eq("id", data.request_id)
      .maybeSingle();
    if (requestError) throw requestError;
    partySize = request?.participants_count ?? 1;
  }

  const { data: row, error } = await supabase
    .from("bookings")
    .insert({
      traveler_id: travelerId,
      guide_id: data.guide_id,
      request_id: data.request_id,
      offer_id: data.offer_id,
      status: "confirmed" as const,
      subtotal_minor: data.subtotal_minor,
      currency: "RUB",
      ...(partySize !== undefined ? { party_size: partySize } : {}),
      ...(data.starts_at ? { starts_at: data.starts_at } : {}),
      ...(data.ends_at ? { ends_at: data.ends_at } : {}),
      ...(data.meeting_point ? { meeting_point: data.meeting_point } : {}),
    })
    .select(BOOKING_SELECT)
    .single();

  if (error) throw error;

  // Seed the face-to-face payment agreement (agreed price + pay-in-person).
  // Best-effort: booking creation must stay an atomic success, so a failed
  // agreement insert is logged but never propagated.
  try {
    await supabase.from("payment_agreements").insert({
      booking_id: row.id,
      agreed_total_minor: data.subtotal_minor,
      currency: "RUB",
      method: "in_person",
    });
  } catch (e) {
    console.warn("[createBooking] payment_agreement seed failed", e);
  }

  return row as Booking;
}

/**
 * Fetch a single booking by ID with joined guide_profiles, traveler_requests, and guide_offers.
 * Returns null if not found.
 *
 * Note: bookings.guide_id has a FK to profiles.id, NOT to guide_profiles.user_id, so
 * PostgREST cannot resolve the join in a single query. We do sequential queries instead.
 */
export async function getBooking(id: Uuid): Promise<BookingWithDetails | null> {
  const supabase = await createSupabaseServerClient();

  const { data: booking, error } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  if (!booking) return null;

  const [guideProfileRes, travelerRequestRes, guideOfferRes] = await Promise.all([
    supabase
      .from("guide_profiles")
      .select(
        "user_id, bio, rating, completed_tours, is_available, regions, languages, specialties, specialization, attestation_status, verification_status, verification_notes, payout_account_label, years_experience, slug, created_at, updated_at, profile:profiles!guide_profiles_user_id_fkey(full_name, phone, avatar_url)",
      )
      .eq("user_id", booking.guide_id)
      .maybeSingle(),
    booking.request_id
      ? supabase
          .from("traveler_requests")
          .select("destination, starts_on, ends_on, participants_count, notes, interests, start_time, end_time, format_preference, open_to_join, traveler_id, guide_template_snapshot")
          .eq("id", booking.request_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    booking.offer_id
      ? supabase
          .from("guide_offers")
          .select("price_minor, currency, message, title, inclusions, capacity, starts_at, ends_at")
          .eq("id", booking.offer_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const guideProfile = (guideProfileRes.data as BookingWithDetails["guide_profile"]) ?? null;

  // Off-platform handoff: reveal the guide's real identity + contact, but ONLY to
  // this booking's own traveler. profiles.full_name / phone are RLS-null when a
  // traveler reads a guide's profile, so resolve them with the admin client behind
  // a strict traveler_id gate. (guide_profiles.display_name was dropped in
  // 20260528154254 — profiles.full_name is now the canonical name.)
  let guidePhone: string | null = null;
  let guideFullName: string | null = null;
  let contactError = false;
  if (hasSupabaseAdminEnv()) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user && user.id === booking.traveler_id) {
      const admin = createSupabaseAdminClient();
      const { data: guideContact, error: guideContactError } = await admin
        .from("profiles")
        .select("full_name, phone")
        .eq("id", booking.guide_id)
        .maybeSingle();
      if (guideContactError) {
        Sentry.captureException(guideContactError, {
          tags: { context: "booking-guide-contact" },
        });
        contactError = true;
      }
      guideFullName = guideContact?.full_name ?? null;
      guidePhone = guideContact?.phone ?? null;
    }
  }

  const resolvedGuideProfile =
    guideProfile && guideFullName
      ? {
          ...guideProfile,
          profile: {
            full_name: guideFullName,
            phone: guidePhone ?? guideProfile.profile?.phone ?? null,
            avatar_url: guideProfile.profile?.avatar_url ?? null,
          },
        }
      : guideProfile;

  return {
    ...booking,
    guide_profile: resolvedGuideProfile,
    guide_phone: guidePhone,
    guide_contact_error: contactError,
    traveler_request: (travelerRequestRes.data as BookingWithDetails["traveler_request"]) ?? null,
    guide_offer: (guideOfferRes.data as BookingWithDetails["guide_offer"]) ?? null,
  };
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
