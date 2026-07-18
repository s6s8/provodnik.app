import type { MetadataRoute } from "next";

import { hasSupabaseAdminEnv } from "@/lib/env";
import { flags } from "@/lib/flags";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const BASE_URL = "https://provodnik.app";

function absoluteUrl(path: string) {
  return `${BASE_URL}${path}`;
}

function buildEntry(
  path: string,
  priority: number,
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>,
  // Evaluated per call so lastModified reflects generation time, not a frozen
  // module-load timestamp (PRD-020).
  lastModified: string | Date = new Date(),
): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(path),
    lastModified,
    changeFrequency,
    priority,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // The public excursions/destinations catalog is hidden per the Wildberries
  // review; when it is off we must not advertise those routes in the sitemap.
  const catalogPublic = flags.FEATURE_PUBLIC_CATALOG;

  const entries: MetadataRoute.Sitemap = [
    buildEntry("/", 1.0, "weekly"),
    ...(catalogPublic
      ? [
          buildEntry("/destinations", 0.9, "weekly"),
          buildEntry("/listings", 0.9, "daily"),
        ]
      : []),
    buildEntry("/guides", 0.9, "weekly"),
    buildEntry("/requests", 0.8, "daily"),
    buildEntry("/how-it-works", 0.6, "monthly"),
    buildEntry("/become-a-guide", 0.6, "monthly"),
    buildEntry("/for-business", 0.5, "monthly"),
    buildEntry("/help", 0.5, "monthly"),
    buildEntry("/trust", 0.5, "monthly"),
    // Orphan page (no in-app inbound links) — kept but de-emphasized (PRD-020).
    buildEntry("/ai", 0.4, "monthly"),
    buildEntry("/policies/terms", 0.3, "yearly"),
    buildEntry("/policies/privacy", 0.3, "yearly"),
    buildEntry("/policies/cookies", 0.3, "yearly"),
  ];

  if (!hasSupabaseAdminEnv()) {
    return entries;
  }

  try {
    const supabase = createSupabaseAdminClient();

    const [listingsResult, destinationsResult, guidesResult, requestsResult] =
      await Promise.all([
        supabase
          .from("listings")
          .select("slug, updated_at")
          .eq("status", "published")
          .not("slug", "is", null),
        supabase
          .from("destinations")
          .select("slug, updated_at")
          .not("slug", "is", null),
        supabase
          .from("guide_profiles")
          .select("slug, updated_at")
          .eq("verification_status", "approved")
          .not("slug", "is", null)
          // Seed/QA guide accounts 404 on the public route (isQaGuideSlug); keep
          // them out of the sitemap so it never advertises dead/QA URLs.
          .not("slug", "ilike", "qa-%"),
        supabase
          .from("traveler_requests")
          .select("id, updated_at")
          .eq("status", "open")
          // Only assembly/joinable requests are publicly viewable; match the
          // page's visibility rule so the sitemap has no dead URLs (PRD-020).
          .or("open_to_join.eq.true,format_preference.eq.group"),
      ]);

    if (catalogPublic && !destinationsResult.error) {
      entries.push(
        ...(destinationsResult.data ?? []).map((destination) =>
          buildEntry(
            `/destinations/${destination.slug}`,
            0.8,
            "weekly",
            destination.updated_at ?? new Date(),
          ),
        ),
      );
    }

    if (catalogPublic && !listingsResult.error) {
      entries.push(
        ...(listingsResult.data ?? []).map((listing) =>
          buildEntry(
            `/listings/${listing.slug}`,
            0.8,
            "weekly",
            listing.updated_at ?? new Date(),
          ),
        ),
      );
    }

    if (!guidesResult.error) {
      entries.push(
        ...(guidesResult.data ?? []).map((guide) =>
          buildEntry(`/guides/${guide.slug}`, 0.7, "weekly", guide.updated_at ?? new Date()),
        ),
      );
    }

    if (!requestsResult.error) {
      entries.push(
        ...(requestsResult.data ?? []).map((request) =>
          buildEntry(`/requests/${request.id}`, 0.6, "daily", request.updated_at ?? new Date()),
        ),
      );
    }
  } catch {
    return entries;
  }

  return entries;
}
