import { describe, expect, it, vi } from "vitest";

import type { RequestRecord } from "@/data/supabase/queries";

const {
  createSupabaseServerClient,
  getRequestById,
  isRequestMember,
  hasSupabaseEnv,
  cityImage,
  notFound,
} = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  getRequestById: vi.fn(),
  isRequestMember: vi.fn(),
  hasSupabaseEnv: vi.fn(),
  cityImage: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

vi.mock("@/data/supabase/queries", () => ({
  getRequestById,
}));

vi.mock("@/lib/supabase/request-members", () => ({
  isRequestMember,
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv,
}));

vi.mock("@/lib/city-image", () => ({
  cityImage,
}));

import RequestDetailPage from "./page";

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
    groupSize: 4,
    capacity: null,
    budgetRub: 3000,
    budgetLabel: "3 000 ₽ / чел.",
    requesterName: "Айгуль",
    requesterInitials: "А",
    requesterAvatarUrl: null,
    description: "Едем небольшой компанией.",
    interests: ["history_culture", "nature"],
    mode: "assembly",
    format: "Сборная",
    status: "open",
    createdAt: "2026-06-01T00:00:00Z",
    offerCount: 0,
    imageUrl: "https://images.unsplash.com/photo-1",
    members: [
      { id: "owner", displayName: "Айгуль", initials: "А" },
      { id: "member", displayName: "Мария", initials: "М" },
    ],
    dateFlexibility: "few_days",
    ...overrides,
  };
}

describe("RequestDetailPage", () => {
  it("builds a сборная view-model with city image and can-join state", async () => {
    const supabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "viewer" } } }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: { traveler_id: "owner" } }),
          })),
        })),
      })),
    };

    createSupabaseServerClient.mockResolvedValue(supabaseClient);
    getRequestById.mockResolvedValue({ data: requestRecord({ id: "assembly-request" }) });
    hasSupabaseEnv.mockReturnValue(true);
    isRequestMember.mockResolvedValue(false);
    cityImage.mockReturnValue("https://images.unsplash.com/photo-city");

    const rendered = await RequestDetailPage({
      params: Promise.resolve({ requestId: "assembly-request" }),
      searchParams: Promise.resolve({}),
    });

    expect(cityImage).toHaveBeenCalledWith("Элиста");
    expect(rendered.props.requestId).toBe("assembly-request");
    expect(rendered.props.viewModel).toMatchObject({
      title: "Элиста",
      regionLabel: "Калмыкия · Россия",
      cityImageUrl: "https://images.unsplash.com/photo-city",
      dateLabel: "25 июня",
      timeLabel: "14:00",
      datesFlexible: true,
      pricePerPersonRub: 3000,
      memberCount: 4,
      organizerName: "Айгуль",
      themes: ["history_culture", "nature"],
      notes: "Едем небольшой компанией.",
      joinState: "can-join",
    });
  });

  it("returns notFound for private requests", async () => {
    createSupabaseServerClient.mockResolvedValue({ from: vi.fn() });
    getRequestById.mockResolvedValue({ data: requestRecord({ id: "private-request", mode: "private" }) });
    hasSupabaseEnv.mockReturnValue(false);

    await expect(
      RequestDetailPage({
        params: Promise.resolve({ requestId: "private-request" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalled();
  });
});
