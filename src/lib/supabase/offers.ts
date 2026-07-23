/**
 * offers.ts — Guide offer service layer (server-only)
 *
 * All functions create their own Supabase client via createSupabaseServerClient.
 * guideId is always sourced from the auth session in the calling server action
 * — never accepted as untrusted input for writes.
 */

import { z } from "zod";

import { rubToKopecks } from "@/data/money";
import { isExpired, normalizeExpiryInput } from "@/lib/dates";
import { notifyBookingCreated, notifyNewOffer } from "@/lib/notifications/triggers";
import { maskPii } from "@/lib/pii/mask";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GuideOfferRow, Uuid } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

export const createOfferInputSchema = z.object({
  request_id: z.string().uuid("Invalid request ID."),
  price_total: z
    .number()
    .int("Use a whole number.")
    .min(1_000, "Price must be at least 1 000 ₽.")
    .max(10_000_000, "Price looks too high."),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters.")
    .max(2_000, "Message must be under 2 000 characters."),
  // Normalizes here, not at the callsites: submitOfferAction, editOfferAction and
  // createGuideOffer all parse through this schema, so `valid_until` is already the
  // stored ISO timestamp by the time it reaches a write. Re-parsing is idempotent.
  valid_until: z
    .string()
    .min(1, "Please provide an expiry date.")
    .transform((value, ctx) => {
      const iso = normalizeExpiryInput(value);
      if (iso === null || isExpired(iso)) {
        ctx.addIssue({ code: "custom", message: "Expiry date must be in the future." });
        return z.NEVER;
      }
      return iso;
    }),
  route_stops: z
    .array(
      z.object({
        photoId: z.string(),
        locationName: z.string().min(1),
        photoUrl: z.string(),
        sortOrder: z.number().int(),
      })
    )
    .default([]),
  route_duration_minutes: z
    .number()
    .int()
    .min(5, "Minimum 5 minutes.")
    .max(1440, "Maximum 24 hours.")
    .nullable()
    .optional(),
  starts_at: z.string().optional().nullable(),
  ends_at: z.string().optional().nullable(),
  inclusions: z.array(z.string().min(1).max(80)).max(20).default([]),
  capacity: z
    .number()
    .int()
    .min(1, "Minimum 1 person.")
    .max(50, "Maximum 50 people.")
    .default(1),
});

export type CreateOfferInput = z.infer<typeof createOfferInputSchema>;

// ---------------------------------------------------------------------------
// Public type
// ---------------------------------------------------------------------------

export type GuideOffer = GuideOfferRow;

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Create a guide offer for a traveler request.
 * Validates with Zod before any DB write.
 * guideId must come from the server auth session — never from client input.
 */
export async function createGuideOffer(
  raw: CreateOfferInput,
  guideId: Uuid,
): Promise<GuideOffer> {
  const input = createOfferInputSchema.parse(raw);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("guide_offers")
    .insert({
      request_id: input.request_id,
      guide_id: guideId,
      price_minor: rubToKopecks(input.price_total),
      message: input.message,
      expires_at: input.valid_until,
      currency: "RUB",
      capacity: input.capacity,
      inclusions: input.inclusions,
      status: "pending",
      route_stops: input.route_stops,
      route_duration_minutes: input.route_duration_minutes ?? null,
      starts_at: input.starts_at ?? null,
      ends_at: input.ends_at ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  const offer = data as GuideOffer;

  try {
    await notifyNewOffer(input.request_id, offer.id);
  } catch (e) {
    // The offer is already committed — a failed notification must not undo it,
    // nor surface as a submission failure to the guide.
    console.error(
      "[createGuideOffer] notification skipped:",
      e instanceof Error ? e.message : e,
    );
  }

  return offer;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/**
 * All offers on a given traveler request.
 */
export async function getOffersForRequest(
  requestId: Uuid,
): Promise<GuideOffer[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("guide_offers")
    .select("*")
    .eq("request_id", requestId)
    .order("traveler_read_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data as GuideOffer[]) ?? []).map((row) => ({
    ...row,
    message: maskPii(row.message),
  }));
}

/**
 * All offers submitted by a specific guide.
 */
export async function getGuideOffers(guideId: Uuid): Promise<GuideOffer[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("guide_offers")
    .select("*")
    .eq("guide_id", guideId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as GuideOffer[]) ?? [];
}

/**
 * Mark all offers on a request as read by the traveler (sets traveler_read_at = now).
 * Only touches rows where traveler_read_at is still NULL.
 * Safe to call fire-and-forget; no-ops if the user doesn't own the request
 * (RLS rejects the update silently).
 */
export async function markOffersReadForRequest(requestId: Uuid): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("guide_offers")
    .update({ traveler_read_at: new Date().toISOString() })
    .eq("request_id", requestId)
    .is("traveler_read_at", null);
}

/** `bookingId` is set only when the booking committed; `error` carries the raw RPC message. */
export type AcceptOfferResult = {
  bookingId: string | null;
  error: string | null;
};

/**
 * Accept an offer through the single `accept_offer` authority and tell the guide.
 *
 * The RPC commits guide, price, sibling declines, request status, booking and payment
 * record in one transaction and derives every value from the offer row server-side.
 * This wrapper adds the one app-side effect the DB can't do: the guide's booking
 * notification. It lives here, next to the RPC call, because both accept surfaces
 * (request page + message thread) go through it — the message thread used to call the
 * RPC directly and notified nobody, so the guide never learned they had been booked.
 *
 * Idempotency comes from the RPC: it locks the offer `FOR UPDATE` and only a `pending`
 * offer produces a booking, so repeat and parallel accepts fail above the notify call.
 * One committed booking → exactly one notification.
 *
 * Callers map `error` (the raw RPC message) to their own user-facing copy.
 */
export async function acceptOfferForTraveler(
  offerId: Uuid,
): Promise<AcceptOfferResult> {
  const supabase = await createSupabaseServerClient();

  const { data: bookingId, error } = await supabase.rpc("accept_offer", {
    p_offer_id: offerId,
  });

  if (error || !bookingId) {
    return { bookingId: null, error: error?.message ?? "offer_not_found" };
  }

  try {
    await notifyBookingCreated(bookingId as string);
  } catch (e) {
    // The booking is already committed — a failed notification must not undo it,
    // nor surface as an acceptance failure to the traveler.
    console.error(
      "[acceptOfferForTraveler] notification skipped:",
      e instanceof Error ? e.message : e,
    );
  }

  return { bookingId: bookingId as string, error: null };
}

/**
 * Returns true if this guide already has an offer on the given request.
 * Use this as a duplicate guard before showing or processing the offer form.
 */
export async function hasGuideOffered(
  guideId: Uuid,
  requestId: Uuid,
): Promise<boolean> {
  const offer = await findGuideOfferOnRequest(guideId, requestId);
  return offer !== null;
}

export async function findGuideOfferOnRequest(
  guideId: Uuid,
  requestId: Uuid,
): Promise<GuideOffer | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("guide_offers")
    .select("*")
    .eq("guide_id", guideId)
    .eq("request_id", requestId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as GuideOffer | null) ?? null;
}
