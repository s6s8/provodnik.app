/**
 * listings.ts — Guide listing CRUD service layer
 *
 * All functions accept a typed Supabase client so they can be called from both
 * server components (createSupabaseServerClient) and server actions.
 *
 * Note on `publishListing`: the DB enum is ('draft','published','paused','rejected').
 * There is no 'pending_review' value. Setting status='published' surfaces the listing
 * to the moderation queue via the existing `moderation_cases` table flow — admin
 * approval is handled there, not at the enum level.
 *
 * Note on `softDeleteListing`: the `listings` table has no `deleted_at` column.
 * Soft-delete is implemented as status='rejected', which excludes the listing from
 * public RLS reads (only the guide and admins can still read it).
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ListingRow, ListingStatusDb, Uuid } from "@/lib/supabase/types";
import {
  listingInputSchema,
  type ListingInput,
} from "@/lib/supabase/listing-schema";

// Re-export so callers can import from one place (server-only context only)
export { listingInputSchema, type ListingInput };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateSlug(title: string, guideId: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9а-яёa-z\s-]/gi, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);
  const suffix = guideId.slice(0, 8);
  const ts = Date.now().toString(36);
  return `${base}-${suffix}-${ts}`.replace(/--+/g, "-");
}

function parseInclusionsArray(text: string | undefined): string[] {
  if (!text) return [];
  return text
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch one listing, verifying it belongs to `guideId`.
 */
export async function getGuideListing(
  id: Uuid,
  guideId: Uuid,
): Promise<ListingRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .eq("guide_id", guideId)
    .maybeSingle();

  if (error) throw error;
  return (data as ListingRow | null) ?? null;
}

/**
 * Fetch all listings for a guide, ordered by most recently updated.
 */
export async function getGuideListings(guideId: Uuid): Promise<ListingRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("guide_id", guideId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data as ListingRow[]) ?? [];
}

/**
 * Create a new listing in status='draft'.
 * Validates input with Zod before any DB call.
 */
export async function createListing(
  raw: ListingInput,
  guideId: Uuid,
): Promise<ListingRow> {
  const input = listingInputSchema.parse(raw);
  const supabase = await createSupabaseServerClient();

  const slug = generateSlug(input.title, guideId);

  const { data, error } = await supabase
    .from("listings")
    .insert({
      guide_id: guideId,
      slug,
      title: input.title,
      description: input.description ?? null,
      region: input.destination,
      category: "general",
      price_from_minor: input.price_per_person * 100,
      max_group_size: input.max_group_size,
      // duration_days mapped to duration_minutes
      duration_minutes: input.duration_days * 24 * 60,
      inclusions: parseInclusionsArray(input.included),
      exclusions: parseInclusionsArray(input.excluded),
      currency: "RUB",
      cancellation_policy_key: "flexible",
      status: "draft" as ListingStatusDb,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as ListingRow;
}

/**
 * Update a listing's mutable fields, verifying ownership first.
 */
export async function updateListing(
  id: Uuid,
  raw: ListingInput,
  guideId: Uuid,
): Promise<ListingRow> {
  const input = listingInputSchema.parse(raw);

  // Verify ownership
  const existing = await getGuideListing(id, guideId);
  if (!existing) {
    throw new Error("Листинг не найден или у вас нет прав на его изменение.");
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("listings")
    .update({
      title: input.title,
      description: input.description ?? null,
      region: input.destination,
      price_from_minor: input.price_per_person * 100,
      max_group_size: input.max_group_size,
      duration_minutes: input.duration_days * 24 * 60,
      inclusions: parseInclusionsArray(input.included),
      exclusions: parseInclusionsArray(input.excluded),
    })
    .eq("id", id)
    .eq("guide_id", guideId)
    .select("*")
    .single();

  if (error) throw error;
  return data as ListingRow;
}

/**
 * Submit a listing for admin review.
 * Sets status='published' — the moderation_cases flow handles admin approval.
 * (DB enum has no 'pending_review' value.)
 */
export async function publishListing(
  id: Uuid,
  guideId: Uuid,
): Promise<ListingRow> {
  const existing = await getGuideListing(id, guideId);
  if (!existing) {
    throw new Error("Листинг не найден или у вас нет прав.");
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("listings")
    .update({ status: "published" as ListingStatusDb })
    .eq("id", id)
    .eq("guide_id", guideId)
    .select("*")
    .single();

  if (error) throw error;
  return data as ListingRow;
}

/**
 * Pause a listing — hides it from public search.
 */
export async function pauseListing(
  id: Uuid,
  guideId: Uuid,
): Promise<ListingRow> {
  const existing = await getGuideListing(id, guideId);
  if (!existing) {
    throw new Error("Листинг не найден или у вас нет прав.");
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("listings")
    .update({ status: "paused" as ListingStatusDb })
    .eq("id", id)
    .eq("guide_id", guideId)
    .select("*")
    .single();

  if (error) throw error;
  return data as ListingRow;
}

/**
 * Soft-delete a listing.
 * The DB has no `deleted_at` column, so this sets status='rejected', which
 * excludes the listing from public RLS reads while keeping the record for auditing.
 */
export async function softDeleteListing(
  id: Uuid,
  guideId: Uuid,
): Promise<void> {
  const existing = await getGuideListing(id, guideId);
  if (!existing) {
    throw new Error("Листинг не найден или у вас нет прав.");
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("listings")
    .update({ status: "rejected" as ListingStatusDb })
    .eq("id", id)
    .eq("guide_id", guideId);

  if (error) throw error;
}
