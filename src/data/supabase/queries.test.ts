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
  formatRequestPreference,
  getActiveListings,
  getDestinationBySlug,
  getDestinations,
  getGuideBySlug,
  getGuideLocationPhotos,
  getGuideReviews,
  getGuides,
  getGuidesByDestination,
  getHomepageRequests,
  mapRequestRow,
  getOffersForRequest,
  getOpenRequests,
  getListingReviews,
  getListingsByDestination,
  getListingsByGuide,
  getSimilarRequests,
} from "@/data/supabase/queries";

type FixtureMap = Record<string, unknown[]>;
type ErrorMap = Record<string, Error>;

type FakeClient = SupabaseClient & {
  calls: string[];
};

class FakeQuery {
  constructor(
    private readonly calls: string[],
    private readonly fixtures: FixtureMap,
    private readonly errors: ErrorMap,
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
    const error = this.errors[this.table];
    if (error) return Promise.resolve({ data: null, error });
    const rows = this.fixtures[this.table] ?? [];
    return Promise.resolve({ data: rows[0] ?? null, error: null });
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown[] | null; error: Error | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    const error = this.errors[this.table] ?? null;
    return Promise.resolve({ data: error ? null : (this.fixtures[this.table] ?? []), error }).then(
      onfulfilled,
      onrejected,
    );
  }
}

function createFakeClient(fixtures: FixtureMap = {}, errors: ErrorMap = {}): FakeClient {
  const calls: string[] = [];
  const client = {
    calls,
    from(table: string) {
      calls.push(`from:${table}`);
      return new FakeQuery(calls, fixtures, errors, table);
    },
    rpc(name: string) {
      calls.push(`rpc:${name}`);
      const error = errors[`rpc:${name}`] ?? null;
      return Promise.resolve({ data: error ? null : (fixtures[`rpc:${name}`] ?? []), error });
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
  it.each([
    { value: "group", expected: "Сборная" },
    { value: "private", expected: "Своя" },
    { value: "combo", expected: "combo" },
  ])("formats request preference $value as $expected", ({ value, expected }) => {
    expect(formatRequestPreference(value)).toBe(expected);
  });

  it.each([
    { formatPreference: "group", expected: "Сборная" },
    { formatPreference: "private", expected: "Своя" },
    { formatPreference: null, expected: "" },
    { formatPreference: "combo", expected: "combo" },
  ])("maps format_preference $formatPreference to $expected", ({ formatPreference, expected }) => {
    const row: Record<string, unknown> = {
      id: "request-1",
      destination: "Москва",
      budget_minor: null,
      participants_count: 2,
      status: "open",
      created_at: "2026-06-03T00:00:00Z",
      format_preference: formatPreference,
    };

    expect(mapRequestRow(row).format).toBe(expected);
  });

  it("maps group format preference to assembly mode even when open_to_join is false", () => {
    const row: Record<string, unknown> = {
      id: "request-1",
      destination: "Москва",
      budget_minor: null,
      participants_count: 2,
      status: "open",
      created_at: "2026-06-03T00:00:00Z",
      format_preference: "group",
      open_to_join: false,
    };

    expect(mapRequestRow(row)).toMatchObject({
      mode: "assembly",
      format: "Сборная",
    });
  });

  it("maps private format preference to private mode even when open_to_join is true", () => {
    const row: Record<string, unknown> = {
      id: "request-1",
      destination: "Москва",
      budget_minor: null,
      participants_count: 2,
      status: "open",
      created_at: "2026-06-03T00:00:00Z",
      format_preference: "private",
      open_to_join: true,
    };

    expect(mapRequestRow(row)).toMatchObject({
      mode: "private",
      format: "Своя",
    });
  });

  it("keeps legacy mode fallback when format preference is missing", () => {
    const row: Record<string, unknown> = {
      id: "request-1",
      destination: "Москва",
      budget_minor: null,
      participants_count: 2,
      status: "open",
      created_at: "2026-06-03T00:00:00Z",
      format_preference: null,
      open_to_join: true,
    };

    expect(mapRequestRow(row).mode).toBe("assembly");
  });

  it("uses anonymous requester and member display data in open request lists", async () => {
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
        },
      ],
      open_request_members: [
        {
          request_id: "request-1",
          traveler_id: "traveler-2",
          status: "joined",
        },
      ],
    });

    const result = await getOpenRequests(client);

    expect(result.error).toBeNull();
    expect(result.data?.[0]).toMatchObject({
      requesterName: "Путешественник",
      requesterInitials: "П",
      requesterAvatarUrl: null,
    });
    expect(result.data?.[0]?.members).toEqual([
      {
        id: "traveler-2",
        displayName: "Участник",
        initials: "У",
      },
    ]);
  });

  it("keeps canonical group size when joined members are loaded", async () => {
    const client = createFakeClient({
      traveler_requests: [
        {
          id: "request-1",
          destination: "Москва",
          budget_minor: 100_000,
          participants_count: 3,
          group_capacity: 5,
          format_preference: "group",
          status: "open",
          category: "city",
          created_at: "2026-06-03T00:00:00Z",
        },
      ],
      open_request_members: [
        {
          request_id: "request-1",
          traveler_id: "traveler-2",
          status: "joined",
        },
      ],
    });

    const result = await getOpenRequests(client);

    expect(result.error).toBeNull();
    expect(result.data?.[0]?.groupSize).toBe(3);
    expect(result.data?.[0]?.members).toHaveLength(1);
  });

  it("surfaces homepage offer count errors instead of returning zero offers", async () => {
    const offerError = new Error("offer policy denied");
    const client = createFakeClient(
      {
        traveler_requests: [
          {
            id: "request-1",
            destination: "Москва",
            budget_minor: 100_000,
            participants_count: 1,
            status: "open",
            category: "city",
            created_at: "2026-06-03T00:00:00Z",
          },
        ],
      },
      {
        guide_offers: offerError,
      },
    );

    const result = await getHomepageRequests(client);

    expect(result.data).toEqual([]);
    expect(result.error).toBe(offerError);
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

  it("surfaces open request member query errors instead of dropping member rows silently", async () => {
    const memberError = new Error("member policy denied");
    const client = createFakeClient(
      {
        traveler_requests: [
          {
            id: "request-1",
            destination: "Москва",
            budget_minor: 100_000,
            participants_count: 2,
            status: "open",
            category: "city",
            created_at: "2026-06-03T00:00:00Z",
          },
        ],
      },
      {
        open_request_members: memberError,
      },
    );

    const result = await getOpenRequests(client);

    expect(result.data).toEqual([]);
    expect(result.error).toBe(memberError);
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
