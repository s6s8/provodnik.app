import "server-only";

import { requireAdminSession } from "@/lib/supabase/moderation";
import { PUBLIC_LISTING_STATUS } from "@/lib/supabase/types";

/**
 * Admin analytics — six fixed questions answered by plain aggregates over the
 * existing tables. No event instrumentation, no new tables, no charting library.
 *
 * Caveats that the UI repeats to the reader (do not paper over them):
 * - `guide_profiles.regions` and `traveler_requests.destination` are free text
 *   typed by users. Region matching is a normalized string match, not a join on
 *   a canonical geo table — treat the supply/gap numbers as indicative.
 * - Conversion is request-scoped. Bookings made straight off a listing
 *   (`bookings.request_id IS NULL`) have no request to convert, so they are
 *   counted in the booking trend but not in the funnel.
 */

/** Demo/QA accounts never enter the numbers (mirrors src/data/admin-users guards). */
const DEMO_DOMAIN_OR = "email.ilike.%@example.com,email.ilike.%@provodnik.test";

// ponytail: rows are aggregated in JS, so a single window is capped here. At the
// current marketplace size this is a few hundred rows; move the grouping into a
// SQL view if a period ever exceeds this cap.
const ROW_CAP = 10_000;

export const ANALYTICS_PERIODS = {
  30: "30 дней",
  90: "90 дней",
  365: "12 месяцев",
} as const;

export type AnalyticsPeriodDays = keyof typeof ANALYTICS_PERIODS;

export const DEFAULT_ANALYTICS_PERIOD: AnalyticsPeriodDays = 365;

export function parseAnalyticsPeriod(value: unknown): AnalyticsPeriodDays {
  const days = Number(value);
  return days in ANALYTICS_PERIODS
    ? (days as AnalyticsPeriodDays)
    : DEFAULT_ANALYTICS_PERIOD;
}

export type AnalyticsSourceRows = {
  requests: {
    id: string;
    traveler_id: string;
    destination: string;
    region: string | null;
    created_at: string;
    starts_on: string;
  }[];
  offers: { request_id: string; guide_id: string }[];
  bookings: {
    id: string;
    request_id: string | null;
    traveler_id: string;
    guide_id: string;
    created_at: string;
    subtotal_minor: number;
  }[];
  listings: { guide_id: string; region: string; city: string | null }[];
  guides: { user_id: string; regions: string[] | null }[];
  demoUserIds: string[];
};

export type AdminAnalytics = {
  /** Q1 — requests per destination in the period. */
  demand: { destination: string; requests: number }[];
  /** Q2 — request → offer → booking funnel. Rates are percentages, 0 when empty. */
  conversion: {
    requests: number;
    withOffer: number;
    withBooking: number;
    offerRate: number;
    bookingRate: number;
  };
  /** Q3 — guides and published listings per region. */
  supply: { region: string; guides: number; listings: number }[];
  /** Q4 — requests per calendar month of the trip start date (12 buckets). */
  seasonality: { month: number; requests: number }[];
  /** Q5 — top destinations by demand with the supply behind them. */
  gap: { destination: string; requests: number; listings: number; guides: number }[];
  /** Q6 — bookings and revenue per calendar month. */
  bookingTrend: { month: string; bookings: number; revenueMinor: number }[];
  totals: { requests: number; offers: number; bookings: number; revenueMinor: number };
};

const TOP_N = 10;

/** Free-text geography: compare on a trimmed, case-folded key. */
function key(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/** Percentage of `total`, rounded to one decimal. 0 (never NaN/Infinity) when total is 0. */
function rate(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function increment(map: Map<string, { label: string; count: number }>, raw: string) {
  const k = key(raw);
  if (!k) return;
  const entry = map.get(k);
  if (entry) entry.count += 1;
  else map.set(k, { label: raw.trim(), count: 1 });
}

export function aggregateAdminAnalytics(rows: AnalyticsSourceRows): AdminAnalytics {
  const demo = new Set(rows.demoUserIds);

  const requests = rows.requests.filter((row) => !demo.has(row.traveler_id));
  const requestIds = new Set(requests.map((row) => row.id));
  const offers = rows.offers.filter(
    (row) => !demo.has(row.guide_id) && requestIds.has(row.request_id),
  );
  const bookings = rows.bookings.filter(
    (row) => !demo.has(row.traveler_id) && !demo.has(row.guide_id),
  );
  const listings = rows.listings.filter((row) => !demo.has(row.guide_id));
  const guides = rows.guides.filter((row) => !demo.has(row.user_id));

  // Q1 — demand by destination.
  const demandByKey = new Map<string, { label: string; count: number }>();
  for (const row of requests) increment(demandByKey, row.destination);
  const demand = [...demandByKey.values()]
    .map((entry) => ({ destination: entry.label, requests: entry.count }))
    .sort((a, b) => b.requests - a.requests || a.destination.localeCompare(b.destination));

  // Q2 — funnel. A request converts once, however many offers it collected.
  const requestsWithOffer = new Set(offers.map((row) => row.request_id));
  const requestsWithBooking = new Set(
    bookings
      .map((row) => row.request_id)
      .filter((id): id is string => Boolean(id) && requestIds.has(id!)),
  );
  const conversion = {
    requests: requests.length,
    withOffer: requestsWithOffer.size,
    withBooking: requestsWithBooking.size,
    offerRate: rate(requestsWithOffer.size, requests.length),
    bookingRate: rate(requestsWithBooking.size, requests.length),
  };

  // Q3 — supply per region (free-text `regions` / `listings.region`).
  const supplyByKey = new Map<
    string,
    { label: string; guides: number; listings: number }
  >();
  const ensureRegion = (raw: string) => {
    const k = key(raw);
    if (!k) return null;
    let entry = supplyByKey.get(k);
    if (!entry) {
      entry = { label: raw.trim(), guides: 0, listings: 0 };
      supplyByKey.set(k, entry);
    }
    return entry;
  };
  for (const guide of guides) {
    for (const region of guide.regions ?? []) {
      const entry = ensureRegion(region);
      if (entry) entry.guides += 1;
    }
  }
  for (const listing of listings) {
    const entry = ensureRegion(listing.region);
    if (entry) entry.listings += 1;
  }
  const supply = [...supplyByKey.values()]
    .map((entry) => ({
      region: entry.label,
      guides: entry.guides,
      listings: entry.listings,
    }))
    .sort(
      (a, b) =>
        b.listings - a.listings ||
        b.guides - a.guides ||
        a.region.localeCompare(b.region),
    );

  // Q4 — seasonality by trip start month (not by request date: the season is the
  // month people want to travel in).
  const seasonality =
    requests.length === 0
      ? []
      : Array.from({ length: 12 }, (_, index) => ({
          month: index + 1,
          requests: requests.filter(
            (row) => Number(row.starts_on.slice(5, 7)) === index + 1,
          ).length,
        }));

  // Q5 — demand vs supply. Supply for a destination = listings whose region OR
  // city matches it, plus guides who list it as one of their regions.
  const gap = demand.slice(0, TOP_N).map((entry) => {
    const k = key(entry.destination);
    return {
      destination: entry.destination,
      requests: entry.requests,
      listings: listings.filter(
        (listing) => key(listing.region) === k || key(listing.city) === k,
      ).length,
      guides: guides.filter((guide) =>
        (guide.regions ?? []).some((region) => key(region) === k),
      ).length,
    };
  });

  // Q6 — booking totals per month.
  const trendByMonth = new Map<string, { bookings: number; revenueMinor: number }>();
  for (const booking of bookings) {
    const month = booking.created_at.slice(0, 7);
    const entry = trendByMonth.get(month) ?? { bookings: 0, revenueMinor: 0 };
    entry.bookings += 1;
    entry.revenueMinor += booking.subtotal_minor ?? 0;
    trendByMonth.set(month, entry);
  }
  const bookingTrend = [...trendByMonth.entries()]
    .map(([month, entry]) => ({ month, ...entry }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    demand: demand.slice(0, TOP_N),
    conversion,
    supply,
    seasonality,
    gap,
    bookingTrend,
    totals: {
      requests: requests.length,
      offers: offers.length,
      bookings: bookings.length,
      revenueMinor: bookings.reduce(
        (sum, booking) => sum + (booking.subtotal_minor ?? 0),
        0,
      ),
    },
  };
}

export async function getAdminAnalytics(
  periodDays: AnalyticsPeriodDays,
): Promise<AdminAnalytics> {
  const { adminClient } = await requireAdminSession();

  const since = new Date(Date.now() - periodDays * 86_400_000).toISOString();

  const [demoResult, requestsResult, offersResult, bookingsResult, listingsResult, guidesResult] =
    await Promise.all([
      adminClient.from("profiles").select("id").or(DEMO_DOMAIN_OR),
      adminClient
        .from("traveler_requests")
        .select("id, traveler_id, destination, region, created_at, starts_on")
        .gte("created_at", since)
        .limit(ROW_CAP),
      adminClient
        .from("guide_offers")
        .select("request_id, guide_id")
        .gte("created_at", since)
        .limit(ROW_CAP),
      adminClient
        .from("bookings")
        .select("id, request_id, traveler_id, guide_id, created_at, subtotal_minor")
        .gte("created_at", since)
        .limit(ROW_CAP),
      // Supply is a snapshot of what travellers can see today, not a windowed count.
      adminClient
        .from("listings")
        .select("guide_id, region, city")
        .eq("status", PUBLIC_LISTING_STATUS)
        .limit(ROW_CAP),
      adminClient
        .from("guide_profiles")
        .select("user_id, regions")
        .eq("verification_status", "approved")
        .limit(ROW_CAP),
    ]);

  return aggregateAdminAnalytics({
    requests: requestsResult.data ?? [],
    offers: offersResult.data ?? [],
    bookings: bookingsResult.data ?? [],
    listings: listingsResult.data ?? [],
    guides: guidesResult.data ?? [],
    demoUserIds: (demoResult.data ?? []).map((row) => row.id),
  });
}
