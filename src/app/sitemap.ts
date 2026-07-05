import type { MetadataRoute } from "next";

import { hasSupabaseAdminEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const BASE_URL = "https://provodnik.app";

function absoluteUrl(path: string) {
  return `${BASE_URL}${path}`;
}

function buildEntry(
  path: string,
  priority: number,
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>,
  // Default is evaluated per call so lastModified reflects generation time, not a
  // frozen module-load timestamp (PRD-020).
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
  const entries: MetadataRoute.Sitemap = [
    buildEntry("/", 1.0, "weekly"),
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

    const [guidesResult, requestsResult] =
      await Promise.all([
        supabase
          .from("guide_profiles")
          .select("slug, updated_at")
          .eq("verification_status", "approved")
          .not("slug", "is", null),
        supabase
          .from("traveler_requests")
          .select("id, updated_at")
          .eq("status", "open")
          // Only assembly/joinable requests are publicly viewable; private ones
          // return "not found" to anon crawlers (404-as-200 class). Match the
          // page's visibility rule so the sitemap has no dead URLs (PRD-020).
          .or("open_to_join.eq.true,format_preference.eq.group"),
      ]);

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
