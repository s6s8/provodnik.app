import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(),
}));
vi.mock("@/lib/supabase/moderation", () => ({
  requireAdminSession: vi.fn(),
}));

import {
  aggregateAdminAnalytics,
  type AnalyticsSourceRows,
} from "@/lib/supabase/admin-analytics";

const EMPTY: AnalyticsSourceRows = {
  requests: [],
  offers: [],
  bookings: [],
  listings: [],
  guides: [],
  demoUserIds: [],
};

function request(
  overrides: Partial<AnalyticsSourceRows["requests"][number]> = {},
): AnalyticsSourceRows["requests"][number] {
  return {
    id: "r1",
    traveler_id: "t1",
    destination: "Тбилиси",
    region: "Грузия",
    created_at: "2026-03-10T10:00:00.000Z",
    starts_on: "2026-07-04",
    ...overrides,
  };
}

describe("aggregateAdminAnalytics — empty dataset", () => {
  it("returns empty sections instead of zeros that look like real numbers", () => {
    const result = aggregateAdminAnalytics(EMPTY);

    expect(result.demand).toEqual([]);
    expect(result.seasonality).toEqual([]);
    expect(result.supply).toEqual([]);
    expect(result.gap).toEqual([]);
    expect(result.bookingTrend).toEqual([]);
    expect(result.conversion).toEqual({
      requests: 0,
      withOffer: 0,
      withBooking: 0,
      offerRate: 0,
      bookingRate: 0,
    });
  });

  it("never yields NaN or Infinity when there are no requests to divide by", () => {
    const result = aggregateAdminAnalytics({
      ...EMPTY,
      // Bookings without any request in the window: the denominator is still 0.
      bookings: [
        {
          id: "b1",
          request_id: null,
          traveler_id: "t1",
          guide_id: "g1",
          created_at: "2026-03-11T10:00:00.000Z",
          subtotal_minor: 500_00,
        },
      ],
    });

    expect(result.conversion.offerRate).toBe(0);
    expect(result.conversion.bookingRate).toBe(0);
    expect(Number.isFinite(result.conversion.offerRate)).toBe(true);
    expect(Number.isFinite(result.conversion.bookingRate)).toBe(true);
  });
});

describe("aggregateAdminAnalytics — demand and conversion", () => {
  it("counts requests per destination, most demanded first", () => {
    const result = aggregateAdminAnalytics({
      ...EMPTY,
      requests: [
        request({ id: "r1", destination: "Тбилиси" }),
        request({ id: "r2", destination: " тбилиси " }),
        request({ id: "r3", destination: "Батуми" }),
      ],
    });

    expect(result.demand).toEqual([
      { destination: "Тбилиси", requests: 2 },
      { destination: "Батуми", requests: 1 },
    ]);
  });

  it("computes request → offer → booking rates as percentages of requests", () => {
    const result = aggregateAdminAnalytics({
      ...EMPTY,
      requests: [
        request({ id: "r1" }),
        request({ id: "r2" }),
        request({ id: "r3" }),
        request({ id: "r4" }),
      ],
      offers: [
        { request_id: "r1", guide_id: "g1" },
        // Two offers on the same request must count the request once.
        { request_id: "r1", guide_id: "g2" },
        { request_id: "r2", guide_id: "g1" },
      ],
      bookings: [
        {
          id: "b1",
          request_id: "r1",
          traveler_id: "t1",
          guide_id: "g1",
          created_at: "2026-03-20T10:00:00.000Z",
          subtotal_minor: 1_000_00,
        },
      ],
    });

    expect(result.conversion).toEqual({
      requests: 4,
      withOffer: 2,
      withBooking: 1,
      offerRate: 50,
      bookingRate: 25,
    });
  });
});

describe("aggregateAdminAnalytics — demo accounts", () => {
  it("excludes rows owned by demo accounts from every section", () => {
    const result = aggregateAdminAnalytics({
      requests: [
        request({ id: "r1", traveler_id: "real", destination: "Тбилиси" }),
        request({ id: "r2", traveler_id: "demo", destination: "Демо-город" }),
      ],
      offers: [
        { request_id: "r1", guide_id: "demo" },
        { request_id: "r2", guide_id: "real-guide" },
      ],
      bookings: [
        {
          id: "b1",
          request_id: "r1",
          traveler_id: "demo",
          guide_id: "real-guide",
          created_at: "2026-03-20T10:00:00.000Z",
          subtotal_minor: 999_00,
        },
      ],
      listings: [
        { guide_id: "demo", region: "Грузия", city: "Тбилиси" },
        { guide_id: "real-guide", region: "Алтай", city: null },
      ],
      guides: [
        { user_id: "demo", regions: ["Грузия"] },
        { user_id: "real-guide", regions: ["Алтай"] },
      ],
      demoUserIds: ["demo"],
    });

    expect(result.demand).toEqual([{ destination: "Тбилиси", requests: 1 }]);
    // r1's only offer came from a demo guide, and its only booking from a demo traveler.
    expect(result.conversion).toEqual({
      requests: 1,
      withOffer: 0,
      withBooking: 0,
      offerRate: 0,
      bookingRate: 0,
    });
    expect(result.bookingTrend).toEqual([]);
    expect(result.totals.revenueMinor).toBe(0);
    expect(result.supply).toEqual([
      { region: "Алтай", guides: 1, listings: 1 },
    ]);
  });
});

describe("aggregateAdminAnalytics — seasonality, supply and trend", () => {
  it("buckets requests into all twelve months by trip start date", () => {
    const result = aggregateAdminAnalytics({
      ...EMPTY,
      requests: [
        request({ id: "r1", starts_on: "2026-07-04" }),
        request({ id: "r2", starts_on: "2026-07-28" }),
        request({ id: "r3", starts_on: "2025-12-31" }),
        // A December trip requested in a different year lands in the same bucket.
        request({ id: "r4", starts_on: "2026-12-01" }),
      ],
    });

    expect(result.seasonality).toHaveLength(12);
    expect(result.seasonality.map((bucket) => bucket.requests)).toEqual([
      0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2,
    ]);
    expect(result.seasonality[6]).toEqual({ month: 7, requests: 2 });
  });

  it("counts guides and published listings per region and flags the demand gap", () => {
    const result = aggregateAdminAnalytics({
      ...EMPTY,
      requests: [
        request({ id: "r1", destination: "Камчатка" }),
        request({ id: "r2", destination: "Камчатка" }),
        request({ id: "r3", destination: "Тбилиси" }),
      ],
      listings: [
        { guide_id: "g1", region: "Грузия", city: "Тбилиси" },
        { guide_id: "g2", region: "Грузия", city: "Батуми" },
      ],
      guides: [
        { user_id: "g1", regions: ["Грузия", "Армения"] },
        { user_id: "g2", regions: null },
      ],
    });

    expect(result.supply).toEqual([
      { region: "Грузия", guides: 1, listings: 2 },
      { region: "Армения", guides: 1, listings: 0 },
    ]);
    // Тбилиси is covered by a listing city; Камчатка has demand and zero supply.
    expect(result.gap).toEqual([
      { destination: "Камчатка", requests: 2, listings: 0, guides: 0 },
      { destination: "Тбилиси", requests: 1, listings: 1, guides: 0 },
    ]);
  });

  it("groups bookings by calendar month with their revenue", () => {
    const result = aggregateAdminAnalytics({
      ...EMPTY,
      bookings: [
        {
          id: "b1",
          request_id: null,
          traveler_id: "t1",
          guide_id: "g1",
          created_at: "2026-02-04T10:00:00.000Z",
          subtotal_minor: 300_00,
        },
        {
          id: "b2",
          request_id: null,
          traveler_id: "t1",
          guide_id: "g1",
          created_at: "2026-03-01T10:00:00.000Z",
          subtotal_minor: 700_00,
        },
        {
          id: "b3",
          request_id: null,
          traveler_id: "t2",
          guide_id: "g1",
          created_at: "2026-03-28T10:00:00.000Z",
          subtotal_minor: 100_00,
        },
      ],
    });

    expect(result.bookingTrend).toEqual([
      { month: "2026-02", bookings: 1, revenueMinor: 300_00 },
      { month: "2026-03", bookings: 2, revenueMinor: 800_00 },
    ]);
    expect(result.totals).toEqual({
      requests: 0,
      offers: 0,
      bookings: 3,
      revenueMinor: 1_100_00,
    });
  });
});
