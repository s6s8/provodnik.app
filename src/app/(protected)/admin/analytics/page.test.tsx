import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAdminAnalytics } = vi.hoisted(() => ({
  getAdminAnalytics: vi.fn(),
}));

vi.mock("@/lib/supabase/admin-analytics", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/supabase/admin-analytics")
  >("@/lib/supabase/admin-analytics");
  return { ...actual, getAdminAnalytics };
});
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: vi.fn() }));
vi.mock("@/lib/supabase/moderation", () => ({ requireAdminSession: vi.fn() }));

import { aggregateAdminAnalytics } from "@/lib/supabase/admin-analytics";

import AdminAnalyticsPage from "./page";

describe("AdminAnalyticsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an honest empty state for every question when there is no data", async () => {
    getAdminAnalytics.mockResolvedValue(
      aggregateAdminAnalytics({
        requests: [],
        offers: [],
        bookings: [],
        listings: [],
        guides: [],
        demoUserIds: [],
      }),
    );

    render(await AdminAnalyticsPage({}));

    // One "нет данных" block per question that has nothing to show.
    expect(await screen.findAllByText(/нет данных/i)).toHaveLength(6);
    // And no fabricated conversion percentage.
    expect(screen.queryByText("0%")).not.toBeInTheDocument();
  });

  it("renders the six sections when data exists", async () => {
    getAdminAnalytics.mockResolvedValue(
      aggregateAdminAnalytics({
        requests: [
          {
            id: "r1",
            traveler_id: "t1",
            destination: "Тбилиси",
            region: "Грузия",
            created_at: "2026-03-10T10:00:00.000Z",
            starts_on: "2026-07-04",
          },
        ],
        offers: [{ request_id: "r1", guide_id: "g1" }],
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
        listings: [{ guide_id: "g1", region: "Грузия", city: "Тбилиси" }],
        guides: [{ user_id: "g1", regions: ["Грузия"] }],
        demoUserIds: [],
      }),
    );

    render(await AdminAnalyticsPage({ searchParams: Promise.resolve({ period: "90" }) }));

    expect(getAdminAnalytics).toHaveBeenCalledWith(90);
    expect(screen.queryByText(/нет данных/i)).not.toBeInTheDocument();
    expect(screen.getAllByText("Тбилиси").length).toBeGreaterThan(0);
    // 1 of 1 request got an offer and a booking.
    expect(screen.getAllByText("100%").length).toBeGreaterThan(0);
  });
});
