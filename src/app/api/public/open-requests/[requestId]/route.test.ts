import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createSupabaseServerClient,
  getRequestById,
  viewerRoleForRequest,
  getPublishedLocationCoversSafe,
} = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  getRequestById: vi.fn(),
  viewerRoleForRequest: vi.fn(),
  getPublishedLocationCoversSafe: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv: () => true,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

vi.mock("@/data/supabase/queries", () => ({
  getRequestById,
}));

vi.mock("@/lib/auth/viewer-role-for-request", () => ({
  viewerRoleForRequest,
}));

vi.mock("@/lib/supabase/location-media", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase/location-media")>();
  return {
    ...actual,
    getPublishedLocationCoversSafe,
  };
});

import { GET } from "./route";

const requestId = "11111111-1111-4111-8111-111111111111";

function assemblyRequest() {
  return {
    id: requestId,
    mode: "assembly" as const,
    destination: "Элиста",
    destinationRegion: "Калмыкия",
    title: "Элиста",
    dateLabel: "25 июня",
    startsOn: "2026-06-25",
    endsOn: null,
    startTime: "14:00",
    endTime: null,
    groupSize: 4,
    capacity: null,
    budgetRub: 5000,
    status: "open" as const,
    description: "private notes",
    interests: ["История"],
    members: [],
    requesterName: "Анна",
    travelerId: "owner-1",
    createdAt: "2026-06-01T00:00:00.000Z",
    offerCount: 0,
    dateFlexibility: null,
    targetGuideId: null,
    imageUrl: null,
    locationLabels: [],
  };
}

function makeSupabase() {
  const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const is = vi.fn(() => ({ maybeSingle }));
  const eqRequest = vi.fn(() => ({ is }));
  const eqStatus = vi.fn(() => ({ eq: eqRequest }));
  const eqTraveler = vi.fn(() => ({ eq: eqStatus }));
  const select = vi.fn(() => ({ eq: eqTraveler }));
  const from = vi.fn(() => ({ select }));

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    },
    from,
  };
}

describe("GET /api/public/open-requests/[requestId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPublishedLocationCoversSafe.mockResolvedValue(new Map());
    createSupabaseServerClient.mockResolvedValue(makeSupabase());
  });

  it("returns an assembly request for public viewers", async () => {
    getRequestById.mockResolvedValue({ data: assemblyRequest(), error: null });
    viewerRoleForRequest.mockResolvedValue("public");

    const response = await GET(new Request("https://example.test"), {
      params: Promise.resolve({ requestId }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.item.id).toBe(requestId);
    expect(body.item.notes).toBe("");
  });

  it("denies public access to a private request", async () => {
    getRequestById.mockResolvedValue({
      data: { ...assemblyRequest(), mode: "private" },
      error: null,
    });
    viewerRoleForRequest.mockResolvedValue("public");

    const response = await GET(new Request("https://example.test"), {
      params: Promise.resolve({ requestId }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Не найдено." });
  });

  it("allows the targeted guide to read a private request", async () => {
    getRequestById.mockResolvedValue({
      data: { ...assemblyRequest(), mode: "private" },
      error: null,
    });
    viewerRoleForRequest.mockResolvedValue("guide");

    const response = await GET(new Request("https://example.test"), {
      params: Promise.resolve({ requestId }),
    });

    expect(response.status).toBe(200);
  });
});
