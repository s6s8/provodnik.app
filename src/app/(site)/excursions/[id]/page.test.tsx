import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient, getPublishedTemplateDetail, notFound, detailScreen } = vi.hoisted(
  () => ({
    createSupabaseServerClient: vi.fn(),
    getPublishedTemplateDetail: vi.fn(),
    notFound: vi.fn(() => {
      throw new Error("NEXT_NOT_FOUND");
    }),
    detailScreen: vi.fn((_props: unknown) => null),
  }),
);

vi.mock("next/navigation", () => ({ notFound }));

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient }));

vi.mock("@/lib/supabase/guide-template-listings", () => ({
  getPublishedTemplateDetail: (...args: unknown[]) => getPublishedTemplateDetail(...args),
}));

vi.mock("@/features/listings/components/public/ready-excursion-detail", () => ({
  ReadyExcursionDetail: (props: unknown) => detailScreen(props),
}));

import ReadyExcursionPage from "./page";

const DETAIL = {
  id: "11111111-1111-1111-1111-111111111111",
  title: "Адык",
  description: "Прогулка по степи.",
  photoUrl: "https://cdn.example/adyk.jpg",
  priceFromKopecks: 450_000,
  priceScope: "per_group" as const,
  durationText: "5 часов",
  meetingPoint: "Элиста, площадь Ленина",
  maxParticipants: 8,
  region: "Калмыкия",
  category: "Культура",
  guide: { slug: "adyk", displayName: "Адык" },
};

describe("ReadyExcursionPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the published template's dedicated detail page", async () => {
    const supabase = {};
    createSupabaseServerClient.mockResolvedValue(supabase);
    getPublishedTemplateDetail.mockResolvedValue(DETAIL);

    render(await ReadyExcursionPage({ params: Promise.resolve({ id: DETAIL.id }) }));

    expect(getPublishedTemplateDetail).toHaveBeenCalledWith(supabase, DETAIL.id);
    expect(detailScreen).toHaveBeenCalledWith({ detail: DETAIL });
  });

  it("returns not found when the template is absent or not public", async () => {
    createSupabaseServerClient.mockResolvedValue({});
    getPublishedTemplateDetail.mockResolvedValue(null);

    await expect(
      ReadyExcursionPage({ params: Promise.resolve({ id: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalled();
  });
});
