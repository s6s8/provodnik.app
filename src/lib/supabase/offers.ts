/**
 * offers.ts — Guide offer service layer (server-only)
 *
 * All functions create their own Supabase client via createSupabaseServerClient.
 * guideId is always sourced from the auth session in the calling server action
 * — never accepted as untrusted input for writes.
 */

import { z } from "zod";

import { rubToKopecks } from "@/data/money";
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
  valid_until: z
    .string()
    .min(1, "Please provide an expiry date.")
    .refine((v) => {
      const d = new Date(v);
      return !Number.isNaN(d.getTime()) && d > new Date();
    }, "Expiry date must be in the future."),
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
      expires_at: new Date(input.valid_until).toISOString(),
      currency: "RUB",
      capacity: 1, // default; may be extended later
      inclusions: [],
      status: "pending",
      route_stops: input.route_stops,
      route_duration_minutes: input.route_duration_minutes ?? null,
      starts_at: input.starts_at ?? null,
      ends_at: input.ends_at ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as GuideOffer;
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
 * Returns true if this guide already has an offer on the given request.
 * Use this as a duplicate guard before showing or processing the offer form.
 */
export async function hasGuideOffered(
  guideId: Uuid,
  requestId: Uuid,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("guide_offers")
    .select("id")
    .eq("guide_id", guideId)
    .eq("request_id", requestId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}
