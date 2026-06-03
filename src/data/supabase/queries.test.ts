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
  getOffersForRequest,
  getOpenRequests,
  getListingReviews,
  getListingsByDestination,
  getListingsByGuide,
  getSimilarRequests,
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

  select(columns?: string) {
    this.calls.push(`${this.table}.select:${columns ?? "*"}`);
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

  eq(column?: string, value?: unknown) {
    this.calls.push(`${this.table}.eq:${column ?? ""}:${String(value)}`);
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

  neq(column?: string, value?: unknown) {
    this.calls.push(`${this.table}.neq:${column ?? ""}:${String(value)}`);
    return this;
  }

  ilike(column?: string, pattern?: string) {
    this.calls.push(`${this.table}.ilike:${column ?? ""}:${pattern ?? ""}`);
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
    { name: "getOffersForRequest", run: (client) => getOffersForRequest(client, "request-1") },
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

describe("PII-safe Supabase query mapping", () => {
  it("masks requester identity and avatar in open request lists", async () => {
    const client = createFakeClient({
      traveler_requests: [
        {
          id: "request-1",
          destination: "Москва",
          budget_minor: 100_000,
          participants_count: 2,
          status: "open",
          category: "city",
          created_at: "2026-06-03T00:00:00Z",
          profiles: {
            full_name: "Анна Петрова",
            avatar_url: "https://example.com/avatar.jpg",
          },
        },
      ],
      open_request_members: [
        {
          request_id: "request-1",
          traveler_id: "traveler-2",
          status: "joined",
          profiles: {
            id: "traveler-2",
            full_name: "Мария Иванова",
            avatar_url: "https://example.com/member.jpg",
          },
        },
      ],
    });

    const result = await getOpenRequests(client);

    expect(result.error).toBeNull();
    expect(result.data?.[0]).toMatchObject({
      requesterName: "Анна П.",
      requesterInitials: "АП",
      requesterAvatarUrl: null,
    });
    expect(result.data?.[0]?.members).toEqual([
      {
        id: "traveler-2",
        displayName: "Мария И.",
        initials: "МИ",
      },
    ]);
  });

  it("masks contact details in offer messages returned for a request", async () => {
    const client = createFakeClient({
      guide_offers: [
        {
          id: "offer-1",
          request_id: "request-1",
          guide_id: "guide-1",
          title: "Байкальский гид",
          price_minor: 200_000,
          capacity: 4,
          message: "Пишите guide@example.com или звоните +79991234567",
          status: "pending",
        },
      ],
    });

    const result = await getOffersForRequest(client, "request-1");

    expect(result.error).toBeNull();
    expect(result.data?.[0]?.message).toBe(
      "Пишите [контакт скрыт] или звоните [контакт скрыт]",
    );
  });
});

describe("query performance safeguards", () => {
  it("filters similar requests by destination in SQL before applying the limit", async () => {
    const client = createFakeClient({
      traveler_requests: [
        {
          id: "request-1",
          destination: "moscow",
          budget_minor: 100_000,
          status: "open",
          created_at: "2026-06-03T00:00:00Z",
        },
      ],
    });

    const result = await getSimilarRequests(client, "moscow", "request-0");

    expect(result.error).toBeNull();
    const destinationFilterIndex = client.calls.findIndex((call) =>
      call.startsWith("traveler_requests.ilike:destination:%moscow%"),
    );
    const limitIndex = client.calls.indexOf("traveler_requests.limit:10");
    expect(destinationFilterIndex).toBeGreaterThan(-1);
    expect(limitIndex).toBeGreaterThan(-1);
    expect(destinationFilterIndex).toBeLessThan(limitIndex);
  });
});
