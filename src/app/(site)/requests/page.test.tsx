import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { RequestRecord } from "@/data/supabase/queries";

const { createSupabaseServerClient, getOpenRequests } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  getOpenRequests: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

vi.mock("@/data/supabase/queries", () => ({
  getOpenRequests,
}));

vi.mock("@/features/requests/components/public-requests-marketplace-screen", () => ({
  PublicRequestsMarketplaceScreen: ({ initialData }: { initialData: unknown }) => (
    <div data-testid="marketplace">{JSON.stringify(initialData)}</div>
  ),
}));

import { RequestsContent } from "./page";

function requestRecord(overrides: Partial<RequestRecord>): RequestRecord {
  return {
    id: "request-1",
    destination: "Элиста",
    destinationSlug: "elista",
    destinationRegion: "Калмыкия · Россия",
    title: "Элиста",
    dateLabel: "25 июня",
    startsOn: "2026-06-25",
    endsOn: null,
    startTime: "14:00",
    endTime: null,
    groupSize: 2,
    capacity: null,
    budgetRub: 3000,
    budgetLabel: "3 000 ₽ / чел.",
    requesterName: "Айгуль",
    requesterInitials: "А",
    requesterAvatarUrl: null,
    description: "Едем небольшой компанией.",
    interests: ["history_culture"],
    mode: "assembly",
    format: "Сборная",
    status: "open",
    createdAt: "2026-06-01T00:00:00Z",
    offerCount: 0,
    imageUrl: "https://images.unsplash.com/photo-1",
    members: [{ id: "u1", displayName: "Айгуль", initials: "А" }],
    dateFlexibility: "few_days",
    ...overrides,
  };
}

function mockMembershipQuery(rows: Array<{ request_id: string }> = []) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ data: rows, error: null }),
  };
  return query;
}

describe("RequestsPage", () => {
  it("loads open requests and passes only сборная records to the catalog", async () => {
    const supabaseClient = { from: vi.fn() };
    createSupabaseServerClient.mockResolvedValue(supabaseClient);
    getOpenRequests.mockResolvedValue({
      data: [
        requestRecord({ id: "assembly-request", mode: "assembly" }),
        requestRecord({ id: "private-request", mode: "private" }),
      ],
    });

    const rendered = await RequestsContent();

    expect(getOpenRequests).toHaveBeenCalledWith(supabaseClient, undefined, ["open"]);
    expect(rendered.props.initialData).toHaveLength(1);
    expect(rendered.props.initialData[0].id).toBe("assembly-request");
    expect(rendered.props.initialData[0].group.openToMoreMembers).toBe(true);
  });

  it("marks records owned by the signed-in viewer with isOwner (№32)", async () => {
    const membershipQuery = mockMembershipQuery();
    const supabaseClient = {
      from: vi.fn().mockReturnValue(membershipQuery),
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "traveler-9" } } }) },
    };
    createSupabaseServerClient.mockResolvedValue(supabaseClient);
    getOpenRequests.mockResolvedValue({
      data: [
        requestRecord({ id: "own-request", travelerId: "traveler-9" }),
        requestRecord({ id: "other-request", travelerId: "traveler-1" }),
        requestRecord({ id: "anon-view-request", travelerId: null }),
      ],
    });

    const rendered = await RequestsContent();

    const byId = Object.fromEntries(
      (rendered.props.initialData as Array<{ id: string; isOwner?: boolean }>).map((r) => [r.id, r.isOwner]),
    );
    expect(byId["own-request"]).toBe(true);
    expect(byId["other-request"]).toBe(false);
    expect(byId["anon-view-request"]).toBe(false);
  });

  it("marks records already joined by the signed-in viewer with isMember", async () => {
    const membershipQuery = mockMembershipQuery([{ request_id: "joined-request" }]);
    const supabaseClient = {
      from: vi.fn().mockReturnValue(membershipQuery),
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "traveler-9" } } }) },
    };
    createSupabaseServerClient.mockResolvedValue(supabaseClient);
    getOpenRequests.mockResolvedValue({
      data: [
        requestRecord({ id: "joined-request", travelerId: "traveler-1" }),
        requestRecord({ id: "other-request", travelerId: "traveler-2" }),
      ],
    });

    const rendered = await RequestsContent();

    expect(supabaseClient.from).toHaveBeenCalledWith("open_request_members");
    expect(membershipQuery.eq).toHaveBeenCalledWith("traveler_id", "traveler-9");
    expect(membershipQuery.eq).toHaveBeenCalledWith("status", "joined");
    expect(membershipQuery.is).toHaveBeenCalledWith("left_at", null);
    const byId = Object.fromEntries(
      (rendered.props.initialData as Array<{ id: string; isMember?: boolean }>).map((r) => [r.id, r.isMember]),
    );
    expect(byId["joined-request"]).toBe(true);
    expect(byId["other-request"]).toBe(false);
  });

  it("passes null initialData to the catalog when the board is empty", async () => {
    createSupabaseServerClient.mockResolvedValue({ from: vi.fn() });
    getOpenRequests.mockResolvedValue({ data: [], error: null });

    const rendered = await RequestsContent();

    expect(rendered.props.initialData).toBeNull();
  });

  it("maps few_days requests with flexible time and no fixed time label", async () => {
    createSupabaseServerClient.mockResolvedValue({ from: vi.fn() });
    getOpenRequests.mockResolvedValue({
      data: [
        requestRecord({
          id: "flex-request",
          dateFlexibility: "few_days",
          startTime: "10:00",
          endTime: "12:00",
        }),
      ],
    });

    const rendered = await RequestsContent();
    const record = rendered.props.initialData[0] as {
      datesFlexible?: boolean;
      timeFlexible?: boolean;
      timeLabel?: string;
    };

    expect(record.datesFlexible).toBe(true);
    expect(record.timeFlexible).toBe(true);
    expect(record.timeLabel).toBeUndefined();
  });

  it("renders the error Alert when the query returns an error", async () => {
    createSupabaseServerClient.mockResolvedValue({ from: vi.fn() });
    getOpenRequests.mockResolvedValue({ data: null, error: new Error("boom") });

    render(await RequestsContent());

    expect(
      screen.getByText("Не удалось загрузить запросы. Попробуйте обновить страницу."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("marketplace")).not.toBeInTheDocument();
  });

  it("renders the error Alert when the load throws", async () => {
    createSupabaseServerClient.mockResolvedValue({ from: vi.fn() });
    getOpenRequests.mockRejectedValue(new Error("database unavailable"));

    render(await RequestsContent());

    expect(
      screen.getByText("Не удалось загрузить запросы. Попробуйте обновить страницу."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("marketplace")).not.toBeInTheDocument();
  });
});
