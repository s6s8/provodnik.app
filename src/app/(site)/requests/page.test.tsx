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

import RequestsPage from "./page";

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

    const rendered = await RequestsPage();

    expect(getOpenRequests).toHaveBeenCalledWith(supabaseClient, undefined, ["open"]);
    expect(rendered.props.initialData).toHaveLength(1);
    expect(rendered.props.initialData[0].id).toBe("assembly-request");
    expect(rendered.props.initialData[0].group.openToMoreMembers).toBe(true);
  });

  it("renders fallback data when the initial requests load fails", async () => {
    createSupabaseServerClient.mockResolvedValue({ from: vi.fn() });
    getOpenRequests.mockRejectedValue(new Error("database unavailable"));

    const rendered = await RequestsPage();

    expect(rendered.props.initialData).toBeNull();
  });
});
