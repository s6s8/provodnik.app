import { beforeEach, describe, expect, it, vi } from "vitest";

import { applyDirectVisibility } from "@/lib/supabase/queries";
import type { RequestRecord } from "@/lib/supabase/queries-core";

const { createSupabaseServerClient, getOpenRequests } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  getOpenRequests: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

vi.mock("@/data/supabase/queries", () => ({
  getOpenRequests,
  makeError: (error: unknown) => error,
}));

import { loadGuideInboxRequests } from "./actions";

function request(id: string, targetGuideId: string | null): RequestRecord {
  return {
    id,
    travelerId: "traveler-1",
    destination: "Казань",
    destinationSlug: "kazan",
    destinationRegion: "",
    title: "Казань",
    dateLabel: "август",
    groupSize: 2,
    capacity: null,
    budgetRub: 0,
    budgetLabel: "не указан",
    requesterName: "П",
    requesterInitials: "П",
    description: "",
    interests: [],
    mode: "private",
    format: "group",
    status: "open",
    createdAt: "2026-07-19",
    offerCount: 0,
    imageUrl: "x",
    members: [],
    targetGuideId,
  };
}

describe("loadGuideInboxRequests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "guide-a" } } }),
      },
    });
  });

  it("passes the signed-in guide id into the inbox query authority", async () => {
    getOpenRequests.mockResolvedValue({ data: [], error: null });

    await loadGuideInboxRequests();

    expect(getOpenRequests).toHaveBeenCalledWith(
      expect.anything(),
      undefined,
      ["open"],
      { viewerGuideId: "guide-a" },
    );
  });

  it("keeps only the addressed directed request visible to that guide", () => {
    const rows = [
      request("open", null),
      request("to-a", "guide-a"),
      request("to-b", "guide-b"),
    ];

    expect(applyDirectVisibility(rows, "guide-a").map((row) => row.id)).toEqual([
      "open",
      "to-a",
    ]);
    expect(applyDirectVisibility(rows, "guide-b").map((row) => row.id)).toEqual([
      "open",
      "to-b",
    ]);
  });
});
