import { render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import type { ListingRecord } from "@/data/supabase/queries";

const { redirectMock, flagsMock, discoveryScreenMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
  flagsMock: { FEATURE_PUBLIC_CATALOG: true },
  discoveryScreenMock: vi.fn((_props: unknown) => null),
}));

vi.mock("next/navigation", () => ({ redirect: redirectMock }));

vi.mock("@/lib/flags", () => ({ flags: flagsMock }));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({})),
}));

const getActiveListings = vi.fn();
vi.mock("@/data/supabase/queries", () => ({
  getActiveListings: (...args: unknown[]) => getActiveListings(...args),
}));

vi.mock("@/features/listings/components/public/public-listing-discovery-screen", () => ({
  PublicListingDiscoveryScreen: discoveryScreenMock,
  isThemeSlug: (value: string | null | undefined) =>
    value === "history_culture" || value === "food" || value === "nature",
}));

import PublicListingsPage from "./page";

describe("PublicListingsPage", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    getActiveListings.mockReset();
    discoveryScreenMock.mockClear();
    flagsMock.FEATURE_PUBLIC_CATALOG = true;
  });

  it("redirects to /guides when the public catalog is hidden (Wildberries review)", async () => {
    flagsMock.FEATURE_PUBLIC_CATALOG = false;

    await expect(
      PublicListingsPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/guides");
    expect(getActiveListings).not.toHaveBeenCalled();
  });

  it("renders the error Alert and not the discovery screen when the query errors", async () => {
    getActiveListings.mockResolvedValueOnce({ data: null, error: new Error("boom") });

    render(await PublicListingsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText("Не удалось загрузить экскурсии. Попробуйте обновить страницу.")).toBeInTheDocument();
    expect(screen.queryByLabelText("discovery")).not.toBeInTheDocument();
  });

  it("passes search and theme query params into the discovery screen", async () => {
    getActiveListings.mockResolvedValueOnce({ data: [], error: null });

    render(
      await PublicListingsPage({
        searchParams: Promise.resolve({ q: "  казань  ", theme: "history_culture" }),
      }),
    );

    expect(discoveryScreenMock.mock.calls[0]?.[0]).toMatchObject({
      initialSearch: "казань",
      initialTheme: "history_culture",
    });
  });

  it("passes a ready tour's per-group price scope and template detail route to the public catalogue", async () => {
    const listing: ListingRecord = {
      id: "listing-1",
      slug: "kazan-kremlin",
      detailHref: "/excursions/template-adyk",
      title: "Казанский кремль",
      destinationSlug: "kazan",
      destinationName: "Казань",
      destinationRegion: "Татарстан",
      imageUrl: "https://example.com/kazan.jpg",
      priceRub: 5000,
      durationDays: 1,
      durationLabel: "1 дн.",
      groupSize: 8,
      difficulty: "Средняя",
      departure: "Казань",
      format: "group",
      priceScope: "per_group",
      category: "history_culture",
      description: "Кремль",
      inclusions: ["Работа гида"],
      exclusions: [],
      guideSlug: "guide-1",
      guideName: "Иван",
      guideHomeBase: "Казань",
      rating: 4.8,
      reviewCount: 12,
      status: "active",
    };
    getActiveListings.mockResolvedValueOnce({ data: [listing], error: null });

    render(await PublicListingsPage({ searchParams: Promise.resolve({}) }));

    expect(discoveryScreenMock.mock.calls[0]?.[0]).toMatchObject({
      listings: [expect.objectContaining({
        priceScope: "per_group",
        detailHref: "/excursions/template-adyk",
      })],
    });
  });
});
