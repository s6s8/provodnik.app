import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(() => {
    throw new Error("query bypassed the supplied Supabase client");
  }),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

import {
  getActiveListings,
  getDestinationBySlug,
  getDestinations,
  getGuideBySlug,
  getGuideLocationPhotos,
  getGuideReviews,
  getGuides,
  getGuidesByDestination,
  getHomepageRequests,
  getListingReviews,
  getListingsByDestination,
  getListingsByGuide,
} from "@/data/supabase/queries";

type FixtureMap = Record<string, unknown[]>;

type FakeClient = SupabaseClient & {
  calls: string[];
};

class FakeQuery {
  constructor(
    private readonly calls: string[],
    private readonly fixtures: FixtureMap,
    private readonly table: string,
  ) {}

  select() {
    this.calls.push(`${this.table}.select`);
    return this;
  }

  order() {
    this.calls.push(`${this.table}.order`);
    return this;
  }

  limit() {
    this.calls.push(`${this.table}.limit`);
    return this;
  }

  eq() {
    this.calls.push(`${this.table}.eq`);
    return this;
  }

  or() {
    this.calls.push(`${this.table}.or`);
    return this;
  }

  in() {
    this.calls.push(`${this.table}.in`);
    return this;
  }

  gt() {
    this.calls.push(`${this.table}.gt`);
    return this;
  }

  neq() {
    this.calls.push(`${this.table}.neq`);
    return this;
  }

  not() {
    this.calls.push(`${this.table}.not`);
    return this;
  }

  maybeSingle() {
    const rows = this.fixtures[this.table] ?? [];
    return Promise.resolve({ data: rows[0] ?? null, error: null });
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown[]; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return Promise.resolve({ data: this.fixtures[this.table] ?? [], error: null }).then(
      onfulfilled,
      onrejected,
    );
  }
}

function createFakeClient(fixtures: FixtureMap = {}): FakeClient {
  const calls: string[] = [];
  const client = {
    calls,
    from(table: string) {
      calls.push(`from:${table}`);
      return new FakeQuery(calls, fixtures, table);
    },
    rpc(name: string) {
      calls.push(`rpc:${name}`);
      return Promise.resolve({ data: fixtures[`rpc:${name}`] ?? [], error: null });
    },
  };

  return client as unknown as FakeClient;
}

describe("public Supabase query helpers", () => {
  beforeEach(() => {
    createClientMock.mockClear();
  });

  const publicReadCases: Array<{
    name: string;
    run: (client: FakeClient) => Promise<{ error: Error | null }>;
    fixtures?: FixtureMap;
  }> = [
    { name: "getDestinations", run: (client) => getDestinations(client) },
    { name: "getDestinationBySlug", run: (client) => getDestinationBySlug(client, "moscow") },
    { name: "getActiveListings", run: (client) => getActiveListings(client) },
    { name: "getListingsByDestination", run: (client) => getListingsByDestination(client, "moscow") },
    { name: "getListingsByGuide", run: (client) => getListingsByGuide(client, "guide-1") },
    { name: "getGuides", run: (client) => getGuides(client) },
    { name: "getGuidesByDestination", run: (client) => getGuidesByDestination(client, "Москва") },
    { name: "getGuideBySlug", run: (client) => getGuideBySlug(client, "guide-1") },
    { name: "getGuideLocationPhotos", run: (client) => getGuideLocationPhotos(client, "guide-1") },
    { name: "getListingReviews", run: (client) => getListingReviews(client, "listing-1") },
    { name: "getGuideReviews", run: (client) => getGuideReviews(client, "guide-1") },
    {
      name: "getHomepageRequests",
      run: (client) => getHomepageRequests(client),
      fixtures: {
        traveler_requests: [
          {
            id: "request-1",
            destination: "Москва",
            budget_minor: 100_000,
            status: "open",
            created_at: "2026-06-03T00:00:00Z",
          },
        ],
        guide_offers: [{ request_id: "request-1" }],
      },
    },
  ];

  it.each(publicReadCases)("$name uses the supplied client instead of creating an admin client", async ({ run, fixtures }) => {
    const client = createFakeClient(fixtures);

    const result = await run(client);

    expect(result.error).toBeNull();
    expect(createClientMock).not.toHaveBeenCalled();
    expect(client.calls.length).toBeGreaterThan(0);
  });
});
