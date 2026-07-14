import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { getHomepageInventory } from "@/lib/supabase/homepage";

type FixtureMap = Record<string, unknown[]>;

/**
 * Minimal PostgREST double: records the chained calls (so we can assert on the
 * status filter) and resolves the table fixture. Filters are NOT applied — the
 * point is to prove the TS-side demo/QA exclusion actually drops the rows even
 * when the server hands them over.
 */
class FakeQuery {
  constructor(
    private readonly calls: string[],
    private readonly fixtures: FixtureMap,
    private readonly table: string,
  ) {}

  select(columns?: string) {
    this.calls.push(`${this.table}.select:${columns ?? "*"}`);
    return this;
  }
  eq(column?: string, value?: unknown) {
    this.calls.push(`${this.table}.eq:${column ?? ""}:${String(value)}`);
    return this;
  }
  in(column?: string) {
    this.calls.push(`${this.table}.in:${column ?? ""}`);
    return this;
  }
  or(filter?: string) {
    this.calls.push(`${this.table}.or:${filter ?? ""}`);
    return this;
  }
  order(column?: string) {
    this.calls.push(`${this.table}.order:${column ?? ""}`);
    return this;
  }
  limit(count?: number) {
    this.calls.push(`${this.table}.limit:${count ?? ""}`);
    return this;
  }
  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown[]; error: Error | null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return Promise.resolve({ data: this.fixtures[this.table] ?? [], error: null }).then(
      onfulfilled,
      onrejected,
    );
  }
}

type FakeClient = SupabaseClient & { calls: string[] };

function createFakeClient(fixtures: FixtureMap): FakeClient {
  const calls: string[] = [];
  return {
    calls,
    from(table: string) {
      calls.push(`from:${table}`);
      return new FakeQuery(calls, fixtures, table);
    },
    rpc(name: string) {
      calls.push(`rpc:${name}`);
      return Promise.resolve({ data: fixtures[`rpc:${name}`] ?? [], error: null });
    },
  } as unknown as FakeClient;
}

const REAL = "11111111-1111-4111-8111-111111111111";
const QA = "22222222-2222-4222-8222-222222222222";
const DEMO = "33333333-3333-4333-8333-333333333333";
const TRAVELER = "44444444-4444-4444-8444-444444444444";
const DEMO_TRAVELER = "55555555-5555-4555-8555-555555555555";

function guideProfileRow(userId: string, slug: string, displayName: string) {
  return {
    user_id: userId,
    slug,
    display_name: displayName,
    verification_status: "approved",
    regions: ["Алтай"],
    years_experience: 7,
    is_available: true,
  };
}

function listingRow(id: string, guideId: string, title: string) {
  return {
    id,
    slug: `listing-${id}`,
    title,
    guide_id: guideId,
    city: "Барнаул",
    region: "Алтай",
    status: "published",
    price_from_minor: 500_000,
    duration_minutes: 480,
  };
}

const fixtures: FixtureMap = {
  guide_profiles: [
    guideProfileRow(REAL, "anna-real", "Анна Реальная"),
    guideProfileRow(QA, "qa-seed-guide", "QA Гид"),
    guideProfileRow(DEMO, "demo-guide", "Демо Гид"),
  ],
  profiles: [
    { id: REAL, email: "anna@mail.ru", full_name: "Анна Реальная" },
    { id: DEMO, email: "guide.altai@example.com", full_name: "Демо Гид" },
    { id: TRAVELER, email: "ivan@mail.ru", full_name: "Иван" },
    { id: DEMO_TRAVELER, email: "seed@provodnik.test", full_name: "Сид" },
  ],
  listings: [
    listingRow("l-1", REAL, "Настоящий маршрут"),
    listingRow("l-2", QA, "QA маршрут"),
    listingRow("l-3", DEMO, "Демо маршрут"),
  ],
  // The view already resolves the author (anon RLS blocks a profiles join) and
  // pre-computes the demo flag, so no traveler_id reaches the app layer.
  v_public_reviews: [
    {
      id: "r-1",
      guide_id: REAL,
      rating: 5,
      title: "Отлично",
      body: "Настоящий отзыв",
      author_name: "Иван П.",
      author_is_demo: false,
      created_at: "2026-07-01T00:00:00Z",
    },
    {
      id: "r-2",
      guide_id: QA,
      rating: 5,
      title: "QA",
      body: "Отзыв на QA-гида",
      author_name: "Иван П.",
      author_is_demo: false,
      created_at: "2026-07-02T00:00:00Z",
    },
    {
      id: "r-3",
      guide_id: DEMO,
      rating: 5,
      title: "Демо",
      body: "Отзыв на демо-гида",
      author_name: "Иван П.",
      author_is_demo: false,
      created_at: "2026-07-03T00:00:00Z",
    },
    {
      id: "r-4",
      guide_id: REAL,
      rating: 5,
      title: "Демо-автор",
      body: "Отзыв от демо-путешественника",
      author_name: "Сид С.",
      author_is_demo: true,
      created_at: "2026-07-04T00:00:00Z",
    },
  ],
  "rpc:search_guides": [
    guideProfileRow(REAL, "anna-real", "Анна Реальная"),
    guideProfileRow(QA, "qa-seed-guide", "QA Гид"),
    guideProfileRow(DEMO, "demo-guide", "Демо Гид"),
  ],
};

describe("getHomepageInventory", () => {
  it("excludes QA-slug and demo-domain accounts from every block", async () => {
    const client = createFakeClient(fixtures);

    const { data, error } = await getHomepageInventory(client);

    expect(error).toBeNull();
    expect(data?.listings.map((l) => l.title)).toEqual(["Настоящий маршрут"]);
    expect(data?.guides.map((g) => g.slug)).toEqual(["anna-real"]);
    // r-2/r-3 belong to QA/demo guides; r-4 was written by a demo traveler.
    expect(data?.reviews.map((r) => r.id)).toEqual(["r-1"]);
  });

  it("names review authors from the anon-safe view, never a profiles join", async () => {
    const client = createFakeClient(fixtures);

    const { data } = await getHomepageInventory(client);

    // The bug: `reviews` + `profiles:traveler_id(full_name)` is NULL for anon (RLS),
    // so every card rendered «Путешественник». If this reads the base table again,
    // the homepage silently loses its authors — with no error anywhere.
    expect(client.calls).toContain("from:v_public_reviews");
    expect(client.calls).not.toContain("from:reviews");
    expect(client.calls.some((call) => call.includes("profiles:traveler_id"))).toBe(false);
    expect(data?.reviews.map((r) => r.authorName)).toEqual(["Иван П."]);
    expect(data?.reviews.map((r) => r.authorInitials)).toEqual(["ИП"]);
  });

  it("reads only published listings, never the legacy active status", async () => {
    const client = createFakeClient(fixtures);

    await getHomepageInventory(client);

    expect(client.calls).toContain("listings.eq:status:published");
    expect(client.calls.some((call) => call.startsWith("listings.eq:status:active"))).toBe(false);
  });

  it("returns empty blocks when the database is unreachable", async () => {
    const client = {
      from() {
        throw new Error("boom");
      },
      rpc() {
        throw new Error("boom");
      },
    } as unknown as SupabaseClient;

    const { data, error } = await getHomepageInventory(client);

    expect(error).toBeInstanceOf(Error);
    expect(data).toEqual({ listings: [], guides: [], reviews: [] });
  });
});
