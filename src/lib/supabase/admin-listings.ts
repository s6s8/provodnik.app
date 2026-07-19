import "server-only";

import { resolveDisplayName } from "@/lib/profile/resolve-display-name";
import type { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ListingStatusDb, Uuid } from "@/lib/supabase/types";

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

export type GuideListingRow = {
  id: Uuid;
  title: string;
  status: ListingStatusDb;
  created_at: string;
};

/** ponytail: no pagination — the panel is a diagnostic, not a browser. */
export const GUIDE_LISTINGS_LIMIT = 50;

/**
 * Every listing of one guide, in every status (drafts included) — the admin needs
 * this to answer "my excursion is invisible": usually the listing never left `draft`.
 * Service-role client: RLS would otherwise hide the guide's non-public rows.
 */
export async function listGuideListings(
  adminClient: AdminClient,
  guideId: string,
): Promise<GuideListingRow[]> {
  const { data, error } = await adminClient
    .from("listings")
    .select("id, title, status, created_at")
    .eq("guide_id", guideId)
    .order("created_at", { ascending: false })
    .limit(GUIDE_LISTINGS_LIMIT);

  if (error) throw error;

  return (data ?? []) as GuideListingRow[];
}

/** ponytail: no pagination, same as above — add it when a real roster outgrows 100. */
export const ALL_LISTINGS_LIMIT = 100;

export type AdminCatalogueRow = {
  id: Uuid;
  title: string;
  /** `template_*` rows come from guide_templates (the live ready-tour path). */
  status:
    | ListingStatusDb
    | "template_published"
    | "template_draft"
    | "template_pending"
    | "template_rejected";
  region: string | null;
  guideId: Uuid;
  guideName: string;
  guideSlug: string | null;
  createdAt: string;
  /** Only `listings` rows can be approved/rejected; templates are self-published. */
  moderatable: boolean;
};

/**
 * Every excursion in the product, in every status, across BOTH tables.
 *
 * The moderation queue answers "what is waiting for me"; this answers "where is my
 * excursion". Those are different questions, and only the first had a surface — so
 * an admin asked about a missing excursion had nowhere to look. It is also the only
 * place the two content shapes are visible side by side: `listings` (moderated, but
 * with no production writer) and `guide_templates` (what guides actually publish,
 * self-published with no review step).
 *
 * Service-role client: RLS hides drafts and other guides' rows from everyone else.
 */
export async function listAllListings(
  adminClient: AdminClient,
  opts?: { status?: string },
): Promise<AdminCatalogueRow[]> {
  const [listingsRes, templatesRes, guidesRes] = await Promise.all([
    adminClient
      .from("listings")
      .select("id, title, status, region, guide_id, created_at")
      .order("created_at", { ascending: false })
      .limit(ALL_LISTINGS_LIMIT),
    adminClient
      .from("guide_templates")
      .select("id, title, status, region, guide_id, created_at")
      .order("created_at", { ascending: false })
      .limit(ALL_LISTINGS_LIMIT),
    adminClient.from("guide_profiles").select("user_id, slug, display_name"),
  ]);

  if (listingsRes.error) throw listingsRes.error;
  if (templatesRes.error) throw templatesRes.error;
  if (guidesRes.error) throw guidesRes.error;

  const guides = new Map(
    (guidesRes.data ?? []).map((row) => [
      row.user_id as string,
      {
        slug: (row.slug as string | null) ?? null,
        name: resolveDisplayName("guide", { full_name: row.display_name as string | null }),
      },
    ]),
  );
  const guideOf = (id: string) =>
    guides.get(id) ?? { slug: null, name: resolveDisplayName("guide", {}) };

  const rows: AdminCatalogueRow[] = [
    ...(listingsRes.data ?? []).map((row) => {
      const guide = guideOf(row.guide_id as string);
      return {
        id: row.id as Uuid,
        title: row.title as string,
        status: row.status as ListingStatusDb,
        region: (row.region as string | null) ?? null,
        guideId: row.guide_id as Uuid,
        guideName: guide.name,
        guideSlug: guide.slug,
        createdAt: row.created_at as string,
        moderatable: true,
      };
    }),
    ...(templatesRes.data ?? []).map((row) => {
      const guide = guideOf(row.guide_id as string);
      return {
        id: row.id as Uuid,
        title: row.title as string,
        status: ({
          published: "template_published",
          pending_review: "template_pending",
          rejected: "template_rejected",
          draft: "template_draft",
        }[row.status as string] ?? "template_draft") as AdminCatalogueRow["status"],
        region: (row.region as string | null) ?? null,
        guideId: row.guide_id as Uuid,
        guideName: guide.name,
        guideSlug: guide.slug,
        createdAt: row.created_at as string,
        moderatable: false,
      };
    }),
  ];

  const filtered = opts?.status ? rows.filter((row) => row.status === opts.status) : rows;
  return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
