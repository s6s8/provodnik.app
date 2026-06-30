import type { MetadataRoute } from "next";

import { hasSupabaseAdminEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const BASE_URL = "https://provodnik.app";
const now = new Date();

function absoluteUrl(path: string) {
  return `${BASE_URL}${path}`;
}

function buildEntry(
  path: string,
  priority: number,
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>,
  lastModified: string | Date = now,
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
    buildEntry("/ai", 0.9, "weekly"),
    buildEntry("/guides", 0.9, "weekly"),
    buildEntry("/requests", 0.8, "daily"),
    buildEntry("/trust", 0.5, "monthly"),
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
          .eq("status", "open"),
      ]);

    if (!guidesResult.error) {
      entries.push(
        ...(guidesResult.data ?? []).map((guide) =>
          buildEntry(`/guides/${guide.slug}`, 0.7, "weekly", guide.updated_at ?? now),
        ),
      );
    }

    if (!requestsResult.error) {
      entries.push(
        ...(requestsResult.data ?? []).map((request) =>
          buildEntry(`/requests/${request.id}`, 0.6, "daily", request.updated_at ?? now),
        ),
      );
    }
  } catch {
    return entries;
  }

  return entries;
}
