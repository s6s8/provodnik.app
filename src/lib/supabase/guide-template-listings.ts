// Ready excursions, read from the table guides actually write to.
//
// The product has two excursion shapes that never met. `listings` is the one every
// public reader queries — homepage block, /listings catalog, moderation queue — but
// nothing in production writes to it: `createListing` has no caller outside its own
// test, and the only real writer is scripts/seed-qa-content.mjs. Meanwhile the live
// guide UI at /guide/listings writes `guide_templates`, which until now NOTHING read:
// not the homepage, not the catalog, not admin, not even the guide's own public
// profile. A guide could publish an excursion and it would appear on no surface in
// the product. That — not a threshold or a feature flag — is why «Готовые экскурсии»
// is empty.
//
// This adapter reads those templates and maps them onto the existing ListingRecord
// card contract, so every surface that already renders excursions renders real ones.
// It is a read path only: no schema, no bridge table, no duplicated content, and no
// migration (guide_templates_select_published already exposes published rows to anon).
//
// Moderation: templates now pass admin review (draft → pending_review → published/rejected,
// enforced by the guide_templates trigger), and this read path only ever returns published
// rows. The extra gate here is the guide: approved verification_status and a non-QA slug,
// the same allow-list the homepage already applies to its other blocks. A template from an
// unapproved or seed guide is never public.
import type { SupabaseClient } from "@supabase/supabase-js";

import { kopecksToRub } from "@/data/money";
import { uniqueNamedLocations } from "@/data/public-discovery-search";

import {
  fallbackHeroImage,
  isQaGuideSlug,
  normalizeSlug,
  type ListingRecord,
} from "./queries-core";
import type { GuideTemplateRow } from "./types";

/** Rows scanned before the approved-guide filter. A bound, not a product limit. */
const TEMPLATE_SCAN = 200;

/** Public catalog/detail reads use the sanitized projection without meeting_point (#58). */
const PUBLIC_PUBLISHED_TEMPLATE_SOURCE = "v_public_published_guide_templates";

type TemplateGuide = { slug: string; displayName: string };

export type PublicGuideTemplateDetail = {
  id: string;
  title: string;
  description: string | null;
  photoUrl: string;
  priceFromKopecks: number | null;
  priceScope: "per_person" | "per_group";
  durationText: string | null;
  meetingPoint: string | null;
  maxParticipants: number | null;
  region: string | null;
  category: string | null;
  guide: TemplateGuide;
};

/** Public namespace for ready excursions, which have no `listings` row or slug. */
export function guideTemplateDetailHref(templateId: string): string {
  return `/excursions/${templateId}`;
}

function mapTemplate(row: GuideTemplateRow, guide: TemplateGuide): ListingRecord {
  const region = row.region ?? "";
  return {
    id: row.id,
    // No `listings` row, so no /listings/{slug} detail route. The id keeps React
    // keys stable and identifies the public ready-excursion detail route.
    slug: row.id,
    detailHref: guideTemplateDetailHref(row.id),
    title: row.title,
    destinationSlug: normalizeSlug(region),
    destinationName: region,
    destinationRegion: region,
    locationLabels: uniqueNamedLocations([region || null]),
    imageUrl: row.photo_urls?.[0] ?? fallbackHeroImage,
    priceRub: row.price_from_kopecks == null ? 0 : kopecksToRub(row.price_from_kopecks),
    // A template has no duration_minutes — only the guide's free text ("5 часов").
    durationDays: 1,
    durationLabel: row.duration_text ?? "",
    groupSize: row.max_participants ?? 0,
    difficulty: "",
    departure: region,
    // A template has no private/group tour type — keep the historical "group" badge and
    // carry the price scope separately (item 2) so the price says «за группу»/«за одного»
    // without mislabeling the tour-type badge on the card.
    format: "group",
    priceScope: (row.price_scope ?? "per_person") as "per_person" | "per_group",
    category: row.category ?? "",
    description: row.description ?? "",
    inclusions: [],
    exclusions: [],
    guideSlug: guide.slug,
    guideName: guide.displayName,
    guideHomeBase: region,
    // Reviews attach to listings/bookings; a template has none. Zero renders as
    // "no rating yet" rather than a fabricated score.
    rating: 0,
    reviewCount: 0,
    status: "active",
  };
}

/**
 * Published templates from approved, non-QA guides, as ListingRecords.
 * Never throws: an empty block is recoverable, a crashed homepage is not.
 */
export async function getPublishedTemplateListings(
  client: SupabaseClient,
  opts?: { guideId?: string },
): Promise<ListingRecord[]> {
  try {
    let query = client
      .from(PUBLIC_PUBLISHED_TEMPLATE_SOURCE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(TEMPLATE_SCAN);
    if (opts?.guideId) query = query.eq("guide_id", opts.guideId);

    const { data: rows, error } = await query;
    if (error) throw error;
    if (!rows || rows.length === 0) return [];

    const guideIds = [...new Set(rows.map((row) => row.guide_id as string))];
    const { data: guideRows, error: guideError } = await client
      .from("guide_profiles")
      .select("user_id, slug, display_name, verification_status")
      .in("user_id", guideIds);
    if (guideError) throw guideError;

    const allowed = new Map<string, TemplateGuide>();
    for (const row of guideRows ?? []) {
      const slug = row.slug as string | null;
      if (row.verification_status !== "approved") continue;
      if (!slug || isQaGuideSlug(slug)) continue;
      allowed.set(row.user_id as string, {
        slug,
        displayName: (row.display_name as string | null) ?? "Локальный гид",
      });
    }

    const records: ListingRecord[] = [];
    for (const row of rows) {
      const guide = allowed.get(row.guide_id as string);
      if (!guide) continue;
      records.push(mapTemplate(row as GuideTemplateRow, guide));
    }
    return records;
  } catch {
    return [];
  }
}

/**
 * Public detail data for one ready excursion. The template and its guide both
 * pass the same visibility gates as the catalog cards, so a copied URL cannot
 * reveal drafts, unapproved guides, or QA fixtures.
 */
export async function getPublishedTemplateDetail(
  client: SupabaseClient,
  templateId: string,
): Promise<PublicGuideTemplateDetail | null> {
  try {
    const { data: templateRaw, error: templateError } = await client
      .from(PUBLIC_PUBLISHED_TEMPLATE_SOURCE)
      .select("*")
      .eq("id", templateId)
      .maybeSingle();
    if (templateError) throw templateError;
    if (!templateRaw) return null;

    const template = templateRaw as GuideTemplateRow;
    // Keep the application boundary safe even if a mocked/stale client ignores
    // the PostgREST status predicate.
    if (template.status !== "published") return null;

    const { data: guideRaw, error: guideError } = await client
      .from("guide_profiles")
      .select("user_id, slug, display_name, verification_status")
      .eq("user_id", template.guide_id)
      .maybeSingle();
    if (guideError) throw guideError;

    const slug = guideRaw?.slug as string | null | undefined;
    if (guideRaw?.verification_status !== "approved" || !slug || isQaGuideSlug(slug)) {
      return null;
    }

    return {
      id: template.id,
      title: template.title,
      description: template.description,
      photoUrl: template.photo_urls?.[0] ?? fallbackHeroImage,
      priceFromKopecks: template.price_from_kopecks,
      priceScope: template.price_scope === "per_group" ? "per_group" : "per_person",
      durationText: template.duration_text,
      meetingPoint: null,
      maxParticipants: template.max_participants,
      region: template.region,
      category: template.category,
      guide: {
        slug,
        displayName: (guideRaw?.display_name as string | null) ?? "Локальный гид",
      },
    };
  } catch {
    return null;
  }
}
