import { describe, expect, it, vi } from "vitest";

import { listAllListings } from "./admin-listings";

type Row = Record<string, unknown>;

function adminClient(fixtures: Record<string, Row[]>) {
  const from = vi.fn((table: string) => {
    const q: Record<string, unknown> = {};
    for (const m of ["select", "order", "limit", "eq"]) {
      q[m] = () => q;
    }
    q.then = (resolve: (v: unknown) => void) =>
      resolve({ data: fixtures[table] ?? [], error: null });
    return q;
  });
  return { from } as unknown as Parameters<typeof listAllListings>[0];
}

const LISTING: Row = {
  id: "l-1",
  title: "Степь и хурул",
  status: "draft",
  region: "Калмыкия",
  guide_id: "g-1",
  created_at: "2026-07-02T00:00:00Z",
};

const TEMPLATE: Row = {
  id: "t-1",
  title: "Тюльпановая степь",
  status: "published",
  region: "Калмыкия",
  guide_id: "g-1",
  created_at: "2026-07-03T00:00:00Z",
};

const GUIDE: Row = { user_id: "g-1", slug: "bair-elista", display_name: "Баир Очиров" };

describe("listAllListings", () => {
  it("shows both content shapes — the whole point of the catalogue", async () => {
    const rows = await listAllListings(
      adminClient({ listings: [LISTING], guide_templates: [TEMPLATE], guide_profiles: [GUIDE] }),
    );

    expect(rows.map((r) => r.title)).toEqual(["Тюльпановая степь", "Степь и хурул"]);
    expect(rows.map((r) => r.status)).toEqual(["template_published", "draft"]);
    // Only `listings` rows have a moderation state to act on.
    expect(rows.map((r) => r.moderatable)).toEqual([false, true]);
  });

  it("keeps drafts visible — the reason an admin opens this page at all", async () => {
    const rows = await listAllListings(
      adminClient({ listings: [LISTING], guide_templates: [], guide_profiles: [GUIDE] }),
      { status: "draft" },
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("draft");
  });

  it("filters templates by their own status, not the listing enum", async () => {
    const rows = await listAllListings(
      adminClient({ listings: [LISTING], guide_templates: [TEMPLATE], guide_profiles: [GUIDE] }),
      { status: "template_published" },
    );

    expect(rows.map((r) => r.id)).toEqual(["t-1"]);
  });

  it("names the guide behind every row", async () => {
    const rows = await listAllListings(
      adminClient({ listings: [LISTING], guide_templates: [], guide_profiles: [GUIDE] }),
    );

    expect(rows[0].guideName).toBe("Баир Очиров");
    expect(rows[0].guideSlug).toBe("bair-elista");
  });

  it("does not drop a row whose guide profile is missing", async () => {
    const rows = await listAllListings(
      adminClient({ listings: [LISTING], guide_templates: [], guide_profiles: [] }),
    );

    // An orphaned excursion is exactly what an admin needs to SEE, not lose.
    expect(rows).toHaveLength(1);
    expect(rows[0].guideName).toBe("Локальный гид");
  });
});
