import { describe, expect, it } from "vitest";

import { getPublishedTemplateListings } from "./guide-template-listings";

type Row = Record<string, unknown>;

/** Minimal PostgREST stand-in: records calls, replays fixtures per table. */
function fakeClient(fixtures: Record<string, Row[]>, errors: Record<string, Error> = {}) {
  const calls: string[] = [];
  const client = {
    calls,
    from(table: string) {
      calls.push(`from:${table}`);
      const q: Record<string, unknown> = {};
      const chain = () => q;
      for (const m of ["select", "eq", "in", "order", "limit", "not"]) {
        q[m] = (...args: unknown[]) => {
          calls.push(`${table}.${m}:${args.map(String).join(":")}`);
          return chain();
        };
      }
      q.then = (resolve: (v: unknown) => void) =>
        resolve({ data: fixtures[table] ?? [], error: errors[table] ?? null });
      return q;
    },
  };
  return client as unknown as Parameters<typeof getPublishedTemplateListings>[0] & {
    calls: string[];
  };
}

const TEMPLATE: Row = {
  id: "11111111-1111-1111-1111-111111111111",
  guide_id: "guide-1",
  title: "Степь и хурул",
  description: "Золотая обитель и степь",
  duration_text: "5 часов",
  price_from_kopecks: 450_000,
  meeting_point: "Площадь Ленина",
  max_participants: 8,
  photo_urls: ["https://cdn.example/photo.jpg"],
  status: "published",
  region: "Калмыкия",
  category: "Культура",
};

const APPROVED_GUIDE: Row = {
  user_id: "guide-1",
  slug: "bair-ochirov",
  display_name: "Баир Очиров",
  verification_status: "approved",
};

describe("getPublishedTemplateListings", () => {
  it("reads only published templates", async () => {
    const client = fakeClient({
      guide_templates: [TEMPLATE],
      guide_profiles: [APPROVED_GUIDE],
    });

    await getPublishedTemplateListings(client);

    expect(client.calls).toContain("from:guide_templates");
    expect(client.calls).toContain("guide_templates.eq:status:published");
  });

  it("maps a template onto the card contract without inventing anything", async () => {
    const client = fakeClient({
      guide_templates: [TEMPLATE],
      guide_profiles: [APPROVED_GUIDE],
    });

    const [rec] = await getPublishedTemplateListings(client);

    expect(rec.id).toBe(TEMPLATE.id);
    expect(rec.title).toBe("Степь и хурул");
    expect(rec.priceRub).toBe(4500);
    // A legacy row (no price_scope) is per-person → format "group" → «за одного».
    // Legacy meaning is never silently reinterpreted.
    expect(rec.format).toBe("group");
    expect(rec.groupSize).toBe(8);
    expect(rec.imageUrl).toBe("https://cdn.example/photo.jpg");
    expect(rec.destinationRegion).toBe("Калмыкия");
    expect(rec.guideName).toBe("Баир Очиров");
    expect(rec.guideSlug).toBe("bair-ochirov");
    // A template has no row in `listings`, so it has no detail route.
    expect(rec.detailHref).toBe("/guides/bair-ochirov");
    // Nothing fabricated: no reviews exist for a template.
    expect(rec.rating).toBe(0);
    expect(rec.reviewCount).toBe(0);
  });

  it("maps a per_group tour to the «за группу» format (item 2)", async () => {
    const client = fakeClient({
      guide_templates: [{ ...TEMPLATE, price_scope: "per_group" }],
      guide_profiles: [APPROVED_GUIDE],
    });

    const [rec] = await getPublishedTemplateListings(client);

    // "private" is what formatExcursionPriceFrom renders as «от X ₽ за группу до N человек».
    expect(rec.format).toBe("private");
    expect(rec.groupSize).toBe(8);
  });

  it("drops templates whose guide is not approved", async () => {
    const client = fakeClient({
      guide_templates: [TEMPLATE],
      guide_profiles: [{ ...APPROVED_GUIDE, verification_status: "pending" }],
    });

    expect(await getPublishedTemplateListings(client)).toEqual([]);
  });

  it("drops templates from QA seed guides", async () => {
    const client = fakeClient({
      guide_templates: [TEMPLATE],
      guide_profiles: [{ ...APPROVED_GUIDE, slug: "qa-guide" }],
    });

    expect(await getPublishedTemplateListings(client)).toEqual([]);
  });

  it("drops templates whose guide has no profile row", async () => {
    const client = fakeClient({ guide_templates: [TEMPLATE], guide_profiles: [] });

    expect(await getPublishedTemplateListings(client)).toEqual([]);
  });

  it("never throws — an empty block beats a broken page", async () => {
    const client = fakeClient({}, { guide_templates: new Error("boom") });

    expect(await getPublishedTemplateListings(client)).toEqual([]);
  });

  it("scopes to one guide when asked", async () => {
    const client = fakeClient({
      guide_templates: [TEMPLATE],
      guide_profiles: [APPROVED_GUIDE],
    });

    await getPublishedTemplateListings(client, { guideId: "guide-1" });

    expect(client.calls).toContain("guide_templates.eq:guide_id:guide-1");
  });

  it("survives a template with no photo, price or cap", async () => {
    const client = fakeClient({
      guide_templates: [
        { ...TEMPLATE, photo_urls: [], price_from_kopecks: null, max_participants: null },
      ],
      guide_profiles: [APPROVED_GUIDE],
    });

    const [rec] = await getPublishedTemplateListings(client);

    expect(rec.priceRub).toBe(0);
    expect(rec.imageUrl).toBeTruthy();
    expect(rec.groupSize).toBe(0);
  });
});
