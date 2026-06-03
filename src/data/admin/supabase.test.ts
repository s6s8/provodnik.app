import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseBrowserClient } = vi.hoisted(() => ({
  createSupabaseBrowserClient: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient,
}));

import { listDisputeCasesForAdminFromSupabase } from "@/data/admin/supabase";

function createAdminSupabase() {
  const fixtures: Record<string, unknown[]> = {
    disputes: [
      {
        id: "dispute-1",
        booking_id: "booking-1",
        opened_by: "traveler-1",
        assigned_admin_id: null,
        status: "open",
        reason: "Quality mismatch",
        summary: "Route did not match",
        requested_outcome: "Refund",
        payout_frozen: false,
        resolution_summary: null,
        created_at: "2026-06-03T00:00:00Z",
        updated_at: "2026-06-03T01:00:00Z",
        resolved_at: null,
      },
    ],
    bookings: [
      {
        id: "booking-1",
        traveler_id: "traveler-1",
        guide_id: "guide-1",
        request_id: "request-1",
        listing_id: "listing-1",
        status: "confirmed",
        starts_at: "2026-06-05T00:00:00Z",
        ends_at: null,
        subtotal_minor: 100_000,
        currency: "USD",
      },
    ],
    profiles: [
      { id: "traveler-1", full_name: "Traveler", email: "traveler@example.com" },
      { id: "guide-1", full_name: "Guide", email: "guide@example.com" },
    ],
    listings: [
      { id: "listing-1", title: "City walk", region: "Region", city: "City" },
    ],
    traveler_requests: [{ id: "request-1", destination: "City" }],
    dispute_notes: [],
  };
  const queries: Record<string, ReturnType<typeof makeQuery>[]> = {};

  function makeQuery(table: string) {
    const query = {
      select: vi.fn(() => query),
      order: vi.fn(() => query),
      range: vi.fn(() => query),
      in: vi.fn(() => query),
      then: vi.fn((resolve, reject) =>
        Promise.resolve({ data: fixtures[table] ?? [], error: null }).then(resolve, reject),
      ),
    };
    return query;
  }

  const from = vi.fn((table: string) => {
    const query = makeQuery(table);
    queries[table] = [...(queries[table] ?? []), query];
    return query;
  });

  return { from, queries };
}

describe("listDisputeCasesForAdminFromSupabase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("paginates disputes and scopes booking hydration to the returned booking ids", async () => {
    const supabase = createAdminSupabase();
    createSupabaseBrowserClient.mockReturnValue({ from: supabase.from });

    await expect(
      listDisputeCasesForAdminFromSupabase({ page: 0, pageSize: 25 }),
    ).resolves.toHaveLength(1);

    expect(supabase.queries.disputes[0]?.range).toHaveBeenCalledWith(0, 24);
    expect(supabase.queries.bookings[0]?.in).toHaveBeenCalledWith("id", ["booking-1"]);
  });
});
