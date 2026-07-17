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
  getDestinationSuggestions,
  getDestinations,
  getGuideBySlug,
  getGuideLocationPhotos,
  getGuideReviews,
  getGuides,
  getGuidesByDestination,
  getHomepageRequests,
  mapRequestRow,
  getOpenRequests,
  getOpenRequestsByDestination,
  getRequestById,
  getPlatformStats,
  getListingReviews,
  getListingsByDestination,
  getListingsByGuide,
  getSimilarRequests,
} from "@/lib/supabase/queries";

type FixtureMap = Record<string, unknown[]>;
type ErrorMap = Record<string, Error>;

type FakeClient = SupabaseClient & {
  calls: string[];
};

class FakeQuery {
  private countMode = false;

  constructor(
    private readonly calls: string[],
    private readonly fixtures: FixtureMap,
    private readonly errors: ErrorMap,
    private readonly table: string,
  ) {}

  select(columns?: string, options?: { count?: string; head?: boolean }) {
    this.calls.push(`${this.table}.select:${columns ?? "*"}`);
    if (options?.count) this.countMode = true;
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

  in(column?: string, values?: unknown[]) {
    this.calls.push(`${this.table}.in:${column ?? ""}:${JSON.stringify(values ?? [])}`);
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
    onfulfilled?: ((value: { data: unknown[] | null; error: Error | null; count: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    const error = this.errors[this.table] ?? null;
    const rows = this.fixtures[this.table] ?? [];
    return Promise.resolve({
      data: error ? null : rows,
      error,
      count: error ? null : (this.countMode ? rows.length : null),
    }).then(onfulfilled, onrejected);
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
    rpc(name: string, args?: unknown) {
      calls.push(`rpc:${name}:${JSON.stringify(args ?? {})}`);
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
            format_preference: "group",
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

describe("getDestinationSuggestions", () => {
  const fixtures: FixtureMap = {
    listings: [
      { city: "Сочи", region: "Юг", guide_id: "g-1" },
      { city: "Сочи", region: "Юг", guide_id: "g-2" },
    ],
    guide_profiles: [
      { base_city: "Элиста", regions: ["Калмыкия", "Астраханская область"] },
      { base_city: "элиста", regions: ["Калмыкия"] }, // casing + region duplicate
    ],
  };

  it("suggests cities, regions and guide directions from one merged, deduped set", async () => {
    const client = createFakeClient(fixtures);

    const { data, error } = await getDestinationSuggestions(client);

    expect(error).toBeNull();
    const names = (data ?? []).map((d) => d.name);
    expect(names).toContain("Сочи"); // listing city
    expect(names).toContain("Элиста"); // guide base city
    expect(names).toContain("Калмыкия"); // guide direction / region
    expect(names).toContain("Астраханская область");
  });

  it("deduplicates by normalized name so the combobox never gets a colliding option", async () => {
    const client = createFakeClient(fixtures);

    const { data } = await getDestinationSuggestions(client);
    const names = (data ?? []).map((d) => d.name);

    // «Элиста»/«элиста» collapse to one; «Калмыкия» appears once despite two guides.
    expect(names.filter((n) => n.toLocaleLowerCase("ru") === "элиста")).toHaveLength(1);
    expect(names.filter((n) => n === "Калмыкия")).toHaveLength(1);
    expect(new Set(names).size).toBe(names.length);
  });

  it("suggests a listing-only region on its own, not just its city", async () => {
    const client = createFakeClient({
      listings: [{ city: "Красная Поляна", region: "Краснодарский край", guide_id: "g-1" }],
      guide_profiles: [],
    });

    const { data } = await getDestinationSuggestions(client);
    const names = (data ?? []).map((d) => d.name);

    expect(names).toContain("Красная Поляна"); // the listing city
    expect(names).toContain("Краснодарский край"); // its region, suggestible alone
  });

  it("keeps same-named places in different regions as distinct options", async () => {
    const client = createFakeClient({
      listings: [
        { city: "Никольское", region: "Астраханская область", guide_id: "g-1" },
        { city: "Никольское", region: "Вологодская область", guide_id: "g-2" },
      ],
      guide_profiles: [],
    });

    const { data } = await getDestinationSuggestions(client);
    const nikolskoye = (data ?? []).filter((d) => d.name === "Никольское");

    expect(nikolskoye).toHaveLength(2);
    expect(nikolskoye.map((d) => d.region).sort()).toEqual([
      "Астраханская область",
      "Вологодская область",
    ]);
  });

  it("returns an empty set (no throw) when nothing matches", async () => {
    const client = createFakeClient({ listings: [], guide_profiles: [] });

    const { data, error } = await getDestinationSuggestions(client);

    expect(error).toBeNull();
    expect(data).toEqual([]);
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

  it("exposes traveler_id as travelerId for ownership checks (№32)", () => {
    const row: Record<string, unknown> = {
      id: "request-1",
      traveler_id: "traveler-9",
      destination: "Москва",
      budget_minor: null,
      participants_count: 2,
      status: "open",
      created_at: "2026-06-03T00:00:00Z",
    };

    expect(mapRequestRow(row).travelerId).toBe("traveler-9");
  });

  it("keeps travelerId null when the sanitized public view omits traveler_id", () => {
    const row: Record<string, unknown> = {
      id: "request-1",
      destination: "Москва",
      budget_minor: null,
      participants_count: 2,
      status: "open",
      created_at: "2026-06-03T00:00:00Z",
    };

    expect(mapRequestRow(row).travelerId).toBeNull();
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
          traveler_id: "traveler-1",
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
    // Creator is prepended; joined member follows
    expect(result.data?.[0]?.members).toHaveLength(2);
    expect(result.data?.[0]?.members[0]).toMatchObject({ id: "traveler-1" });
    expect(result.data?.[0]?.members[1]).toMatchObject({ id: "traveler-2" });
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
          traveler_id: "traveler-1",
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
    // Creator + 1 joined member
    expect(result.data?.[0]?.members).toHaveLength(2);
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

  it("keeps private requests out of homepage open groups", async () => {
    const client = createFakeClient({
      traveler_requests: [
        {
          id: "private-request",
          destination: "Москва",
          budget_minor: 100_000,
          participants_count: 2,
          status: "open",
          category: "city",
          created_at: "2026-06-04T00:00:00Z",
          traveler_id: "traveler-1",
          format_preference: "private",
        },
        {
          id: "group-request",
          destination: "Казань",
          budget_minor: 80_000,
          participants_count: 1,
          group_capacity: 4,
          status: "open",
          category: "city",
          created_at: "2026-06-03T00:00:00Z",
          traveler_id: "traveler-2",
          format_preference: "group",
        },
      ],
      guide_offers: [],
    });

    const result = await getHomepageRequests(client);

    expect(result.error).toBeNull();
    expect(result.data?.map((request) => request.id)).toEqual(["group-request"]);
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

describe("guide stats layering (no fabricated zeros)", () => {
  it("layers real view stats and approved verification onto getGuideBySlug", async () => {
    const client = createFakeClient({
      "rpc:get_public_guide_by_slug": [
        {
          user_id: "guide-1",
          slug: "guide-1",
          full_name: "Иван Гид",
          regions: ["Москва"],
          verification_status: "approved",
        },
      ],
      v_guide_public_profile: [
        { average_rating: 4.6, review_count: 8, response_rate: 91 },
      ],
    });

    const result = await getGuideBySlug(client, "guide-1");

    expect(result.error).toBeNull();
    expect(result.data?.rating).toBe(4.6);
    expect(result.data?.reviewCount).toBe(8);
    expect(result.data?.responseRate).toBe(91);
    expect(result.data?.verified).toBe(true);
  });

  it("resolves public guide detail via the RPC when Next passes an encoded slug", async () => {
    const client = createFakeClient({
      "rpc:get_public_guide_by_slug": [
        {
          user_id: "guide-1",
          slug: "жюль-верников-69f18040",
          full_name: "Жюль Верников",
          regions: ["Волгоградская область"],
          verification_status: "approved",
        },
      ],
      v_guide_public_profile: [],
    });

    const result = await getGuideBySlug(
      client,
      "%D0%B6%D1%8E%D0%BB%D1%8C-%D0%B2%D0%B5%D1%80%D0%BD%D0%B8%D0%BA%D0%BE%D0%B2-69f18040",
    );

    expect(result.error).toBeNull();
    expect(result.data?.fullName).toBe("Жюль Верников");
    // The RPC is asked for every slug candidate (encoded + decoded forms) so a
    // Cyrillic slug still resolves regardless of how Next percent-encodes it.
    const rpcCall = client.calls.find((c) => c.startsWith("rpc:get_public_guide_by_slug:"));
    expect(rpcCall).toContain(
      "%D0%B6%D1%8E%D0%BB%D1%8C-%D0%B2%D0%B5%D1%80%D0%BD%D0%B8%D0%BA%D0%BE%D0%B2-69f18040",
    );
    expect(rpcCall).toContain("жюль-верников-69f18040");
  });

  it("maps base_city and specializations from the detail RPC (№26/№27)", async () => {
    const client = createFakeClient({
      "rpc:get_public_guide_by_slug": [
        {
          user_id: "guide-1",
          slug: "guide-1",
          full_name: "Иван Гид",
          regions: ["Волгоградская область"],
          base_city: "Волгоград",
          specializations: ["history_culture", "nature"],
          verification_status: "approved",
        },
      ],
      v_guide_public_profile: [],
    });

    const result = await getGuideBySlug(client, "guide-1");

    expect(result.error).toBeNull();
    expect(result.data?.homeBase).toBe("Волгоградская область, Волгоград");
    expect(result.data?.baseCity).toBe("Волгоград");
    expect(result.data?.specializations).toEqual(["history_culture", "nature"]);
  });

  it("falls back homeBase to the region when base_city is absent", async () => {
    const client = createFakeClient({
      "rpc:get_public_guide_by_slug": [
        {
          user_id: "guide-1",
          slug: "guide-1",
          full_name: "Иван Гид",
          regions: ["Москва"],
          verification_status: "approved",
        },
      ],
      v_guide_public_profile: [],
    });

    const result = await getGuideBySlug(client, "guide-1");

    expect(result.data?.homeBase).toBe("Москва");
    expect(result.data?.specializations).toEqual([]);
  });

  it("maps avatar_url from the guide RPC so the profile shows the photo, not initials (#24)", async () => {
    const client = createFakeClient({
      "rpc:get_public_guide_by_slug": [
        {
          user_id: "guide-1",
          slug: "guide-1",
          full_name: "Иван Гид",
          avatar_url: "https://cdn.test/guide-1.png",
          regions: ["Москва"],
          verification_status: "approved",
        },
      ],
      v_guide_public_profile: [],
    });

    const result = await getGuideBySlug(client, "guide-1");

    expect(result.data?.avatarUrl).toBe("https://cdn.test/guide-1.png");
  });

  it("keeps rating 0 and null responseRate when the stats view is absent", async () => {
    const client = createFakeClient({
      "rpc:get_public_guide_by_slug": [
        {
          user_id: "guide-1",
          slug: "guide-1",
          full_name: "Иван Гид",
          regions: ["Москва"],
          verification_status: "approved",
        },
      ],
      v_guide_public_profile: [],
    });

    const result = await getGuideBySlug(client, "guide-1");

    expect(result.error).toBeNull();
    expect(result.data?.verified).toBe(true);
    expect(result.data?.rating).toBe(0);
    expect(result.data?.responseRate).toBeNull();
  });

  it("returns null (public 404) when the guide RPC yields no active guide", async () => {
    const client = createFakeClient({ "rpc:get_public_guide_by_slug": [] });

    const result = await getGuideBySlug(client, "suspended-guide");

    expect(result.error).toBeNull();
    expect(result.data).toBeNull();
  });

  it("includes approved guides in destination blocks even before they have listings", async () => {
    const client = createFakeClient({
      "rpc:search_guides": [
        {
          user_id: "guide-1",
          slug: "guide-1",
          display_name: "Иван Гид",
          regions: ["Москва"],
          years_experience: 7,
          verification_status: "approved",
        },
      ],
      profiles: [],
      v_guide_public_profile: [{ user_id: "guide-1", average_rating: 4.9 }],
    });

    const result = await getGuidesByDestination(client, "Москва");

    expect(result.error).toBeNull();
    expect(result.data?.[0]?.rating).toBe(4.9);
    expect(result.data?.[0]?.verified).toBe(true);
    expect(client.calls).toContain(
      'rpc:search_guides:{"q":"","p_region":"Москва","p_has_listings":false}',
    );
  });

  it("includes approved guides in public guide search even before they have listings", async () => {
    const client = createFakeClient({
      "rpc:search_guides": [
        {
          user_id: "guide-1",
          slug: "guide-1",
          display_name: "Иван Гид",
          regions: ["Москва"],
          verification_status: "approved",
        },
      ],
      profiles: [],
      listings: [],
      v_guide_public_profile: [],
    });

    const result = await getGuides(client, { q: "Иван" });

    expect(result.error).toBeNull();
    expect(result.data?.[0]?.fullName).toBe("Иван Гид");
    expect(result.data?.[0]?.listingCount).toBe(0);
    expect(client.calls).toContain(
      'rpc:search_guides:{"q":"Иван","p_specializations":null,"p_has_listings":false}',
    );
  });
});

describe("destination ratings (no fabricated stars)", () => {
  it("keeps the real rating and returns null when no rating exists in getDestinations", async () => {
    const client = createFakeClient({
      destinations: [
        { id: "dest-1", slug: "moscow", name: "Москва", rating: 4.2 },
        { id: "dest-2", slug: "kazan", name: "Казань", rating: null },
      ],
    });

    const result = await getDestinations(client);

    expect(result.error).toBeNull();
    expect(result.data?.[0]?.avgRating).toBe(4.2);
    expect(result.data?.[1]?.avgRating).toBeNull();
  });

  it("returns null avgRating from getDestinationBySlug when the row has no rating", async () => {
    const client = createFakeClient({
      destinations: [{ id: "dest-1", slug: "moscow", name: "Москва", rating: null }],
    });

    const result = await getDestinationBySlug(client, "moscow");

    expect(result.error).toBeNull();
    expect(result.data?.avgRating).toBeNull();
  });

  it("decodes a percent-encoded Cyrillic destination slug before lookup (PRD-001)", async () => {
    const client = createFakeClient({
      destinations: [{ id: "dest-2", slug: "москва", name: "Москва", rating: 4 }],
    });

    // Next.js delivers the route param percent-encoded; the DB stores raw
    // Cyrillic. Without decodeSlug the "%D0%BC…" input never matches and 404s.
    const result = await getDestinationBySlug(client, encodeURIComponent("москва"));

    expect(result.error).toBeNull();
    expect(result.data?.name).toBe("Москва");
  });
});

describe("getPlatformStats", () => {
  it("maps the single platform_stats view row to camelCase counts", async () => {
    const client = createFakeClient({
      platform_stats: [{ guides_active: 15, listings_total: 12, trips_total: 10 }],
    });

    const result = await getPlatformStats(client);

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ guidesActive: 15, listingsTotal: 12, tripsTotal: 10 });
  });

  it("returns the error when the view query fails", async () => {
    const statsError = new Error("platform_stats policy denied");
    const client = createFakeClient({}, { platform_stats: statsError });

    const result = await getPlatformStats(client);

    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it("returns null data without an error when no row is present", async () => {
    const client = createFakeClient({ platform_stats: [] });

    const result = await getPlatformStats(client);

    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
  });
});

describe("getOpenRequestsByDestination", () => {
  it("returns mapped open requests for the given region", async () => {
    const client = createFakeClient({
      traveler_requests: [
        {
          id: "request-1",
          destination: "Элиста",
          region: "Калмыкия",
          budget_minor: 100_000,
          participants_count: 2,
          status: "open",
          created_at: "2026-06-03T00:00:00Z",
          traveler_id: "traveler-1",
          format_preference: "group",
        },
        {
          id: "request-2",
          destination: "Городовиковск",
          region: "Калмыкия",
          budget_minor: 80_000,
          participants_count: 1,
          status: "open",
          created_at: "2026-06-02T00:00:00Z",
          traveler_id: "traveler-2",
          format_preference: "group",
        },
      ],
    });

    const result = await getOpenRequestsByDestination(client, "Калмыкия");

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
    expect(result.data?.every((rec) => rec.status === "open")).toBe(true);
  });

  it("returns an empty list when no open requests match the region", async () => {
    const client = createFakeClient({ traveler_requests: [] });

    const result = await getOpenRequestsByDestination(client, "Калмыкия");

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  it("layers the real guide_offers count per request (no fabricated zeros)", async () => {
    const client = createFakeClient({
      traveler_requests: [
        {
          id: "request-1",
          destination: "Элиста",
          region: "Калмыкия",
          budget_minor: 100_000,
          participants_count: 2,
          status: "open",
          created_at: "2026-06-03T00:00:00Z",
          traveler_id: "traveler-1",
          format_preference: "group",
        },
        {
          id: "request-2",
          destination: "Городовиковск",
          region: "Калмыкия",
          budget_minor: 80_000,
          participants_count: 1,
          status: "open",
          created_at: "2026-06-02T00:00:00Z",
          traveler_id: "traveler-2",
          format_preference: "group",
        },
      ],
      guide_offers: [
        { request_id: "request-1" },
        { request_id: "request-1" },
        { request_id: "request-2" },
      ],
    });

    const result = await getOpenRequestsByDestination(client, "Калмыкия");

    expect(result.error).toBeNull();
    const byId = new Map(result.data?.map((rec) => [rec.id, rec]));
    expect(byId.get("request-1")?.offerCount).toBe(2);
    expect(byId.get("request-2")?.offerCount).toBe(1);
  });

  it("keeps private requests out of destination open groups", async () => {
    const client = createFakeClient({
      traveler_requests: [
        {
          id: "private-request",
          destination: "Элиста",
          region: "Калмыкия",
          budget_minor: 100_000,
          participants_count: 2,
          status: "open",
          created_at: "2026-06-04T00:00:00Z",
          traveler_id: "traveler-1",
          format_preference: "private",
        },
        {
          id: "group-request",
          destination: "Элиста",
          region: "Калмыкия",
          budget_minor: 80_000,
          participants_count: 1,
          group_capacity: 4,
          status: "open",
          created_at: "2026-06-03T00:00:00Z",
          traveler_id: "traveler-2",
          format_preference: "group",
        },
      ],
      guide_offers: [],
    });

    const result = await getOpenRequestsByDestination(client, "Калмыкия");

    expect(result.error).toBeNull();
    expect(result.data?.map((request) => request.id)).toEqual(["group-request"]);
  });

  it("surfaces guide_offers count errors instead of returning zero offers", async () => {
    const offerError = new Error("offer policy denied");
    const client = createFakeClient(
      {
        traveler_requests: [
          {
            id: "request-1",
            destination: "Элиста",
            region: "Калмыкия",
            budget_minor: 100_000,
            participants_count: 2,
            status: "open",
            created_at: "2026-06-03T00:00:00Z",
            traveler_id: "traveler-1",
          },
        ],
      },
      { guide_offers: offerError },
    );

    const result = await getOpenRequestsByDestination(client, "Калмыкия");

    expect(result.data).toEqual([]);
    expect(result.error).toBe(offerError);
  });
});

describe("getRequestById", () => {
  const requestFixture = {
    id: "request-1",
    destination: "Москва",
    budget_minor: 100_000,
    participants_count: 2,
    status: "open",
    created_at: "2026-06-03T00:00:00Z",
    traveler_id: "traveler-1",
  };

  it("layers the real guide_offers count onto the request", async () => {
    const client = createFakeClient({
      traveler_requests: [requestFixture],
      guide_offers: [{ id: "offer-1" }, { id: "offer-2" }, { id: "offer-3" }],
    });

    const result = await getRequestById(client, "request-1");

    expect(result.error).toBeNull();
    expect(result.data?.offerCount).toBe(3);
  });

  it("reports offerCount 0 when the request has no guide offers", async () => {
    const client = createFakeClient({
      traveler_requests: [requestFixture],
      guide_offers: [],
    });

    const result = await getRequestById(client, "request-1");

    expect(result.error).toBeNull();
    expect(result.data?.offerCount).toBe(0);
  });

  it("surfaces guide_offers count errors instead of returning zero offers", async () => {
    const offerError = new Error("offer policy denied");
    const client = createFakeClient(
      { traveler_requests: [requestFixture] },
      { guide_offers: offerError },
    );

    const result = await getRequestById(client, "request-1");

    expect(result.data).toBeNull();
    expect(result.error).toBe(offerError);
  });
});

describe("anonymous public request access uses the sanitized view", () => {
  it("getOpenRequests falls back to v_public_open_requests when the raw table is empty", async () => {
    const client = createFakeClient({
      traveler_requests: [],
      v_public_open_requests: [
        {
          id: "req-pub-1",
          destination: "Казань",
          budget_minor: 50_000,
          participants_count: 2,
          status: "open",
          created_at: "2026-06-03T00:00:00Z",
        },
      ],
    });

    const result = await getOpenRequests(client, undefined, ["open"]);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0]?.id).toBe("req-pub-1");
    // No traveler_id in the view row → no anonymous read of the raw table.
    expect(client.calls).toContain("from:v_public_open_requests");
    expect(result.data?.[0]?.members).toEqual([]);
  });

  // The homepage «Сборные группы» block is the first thing a logged-out visitor
  // is meant to see, and traveler_requests_select needs auth.uid() IS NOT NULL —
  // so without this fallback the block renders for nobody who is not signed in.
  // Its two siblings (getOpenRequests, getOpenRequestsByDestination) already do this.
  it("getHomepageRequests falls back to v_public_open_requests for anonymous visitors", async () => {
    const client = createFakeClient({
      traveler_requests: [],
      v_public_open_requests: [
        {
          id: "req-pub-home",
          destination: "Элиста",
          budget_minor: 100_000,
          participants_count: 3,
          status: "open",
          created_at: "2026-06-03T00:00:00Z",
          // The homepage block only shows assembly (open-to-join) groups.
          open_to_join: true,
          group_capacity: 6,
        },
      ],
    });

    const result = await getHomepageRequests(client);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0]?.id).toBe("req-pub-home");
    expect(client.calls).toContain("from:v_public_open_requests");
  });

  it("getRequestById falls back to v_public_open_requests when the raw row is RLS-hidden", async () => {
    const client = createFakeClient({
      traveler_requests: [],
      v_public_open_requests: [
        {
          id: "req-pub-2",
          destination: "Сочи",
          budget_minor: 0,
          participants_count: 1,
          status: "open",
          created_at: "2026-06-03T00:00:00Z",
        },
      ],
      guide_offers: [],
    });

    const result = await getRequestById(client, "req-pub-2");

    expect(result.error).toBeNull();
    expect(result.data?.id).toBe("req-pub-2");
    expect(client.calls).toContain("from:v_public_open_requests");
    expect(result.data?.members).toEqual([]);
  });

  it("getOpenRequestsByDestination falls back to the public view for anon discovery", async () => {
    const client = createFakeClient({
      traveler_requests: [],
      v_public_open_requests: [
        {
          id: "req-pub-3",
          destination: "Элиста",
          region: "Калмыкия",
          budget_minor: 80_000,
          participants_count: 1,
          status: "open",
          format_preference: "group",
          open_to_join: true,
          created_at: "2026-06-03T00:00:00Z",
        },
      ],
      guide_offers: [],
    });

    const result = await getOpenRequestsByDestination(client, "Калмыкия");

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0]?.id).toBe("req-pub-3");
    expect(client.calls).toContain("from:v_public_open_requests");
  });
});
