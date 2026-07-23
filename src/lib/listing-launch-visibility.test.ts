import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ListingRecord } from "@/lib/supabase/queries-core";

const flagsMock = vi.hoisted(() => ({
  FEATURE_TR_TOURS: false,
  FEATURE_PUBLIC_CATALOG: true,
}));

vi.mock("@/lib/flags", () => ({ flags: flagsMock }));

import {
  filterLaunchVisibleListingRows,
  filterLaunchVisibleListings,
  isListingExpTypeLaunchVisible,
  isReadyExcursionLaunchVisible,
} from "./listing-launch-visibility";

function listing(overrides: Partial<ListingRecord> = {}): ListingRecord {
  return {
    id: "listing-1",
    slug: "listing-1",
    title: "Маршрут",
    destinationSlug: "kazan",
    destinationName: "Казань",
    destinationRegion: "Татарстан",
    imageUrl: "https://cdn.example/photo.jpg",
    priceRub: 5000,
    durationDays: 1,
    durationLabel: "1 день",
    groupSize: 6,
    difficulty: "Лёгкая",
    departure: "Казань",
    format: "group",
    category: "culture",
    description: "Описание",
    inclusions: [],
    exclusions: [],
    guideSlug: "guide-1",
    guideName: "Анна Реальная",
    guideHomeBase: "Казань",
    rating: 4.8,
    reviewCount: 10,
    status: "active",
    ...overrides,
  };
}

describe("listing-launch-visibility", () => {
  beforeEach(() => {
    flagsMock.FEATURE_TR_TOURS = false;
    flagsMock.FEATURE_PUBLIC_CATALOG = true;
  });

  it("hides tours when the tour launch flag is off", () => {
    expect(isListingExpTypeLaunchVisible("tour")).toBe(false);
    expect(
      filterLaunchVisibleListingRows([{ id: "tour-1", exp_type: "tour" }]),
    ).toEqual([]);
    expect(
      filterLaunchVisibleListings([listing({ expType: "tour" })]),
    ).toEqual([]);
  });

  it("keeps tours when the tour launch flag is on", () => {
    flagsMock.FEATURE_TR_TOURS = true;

    expect(isListingExpTypeLaunchVisible("tour")).toBe(true);
    expect(
      filterLaunchVisibleListings([listing({ expType: "tour" })]),
    ).toHaveLength(1);
  });

  it("keeps ordinary excursions visible regardless of the tour flag", () => {
    expect(isListingExpTypeLaunchVisible("excursion")).toBe(true);
    expect(isListingExpTypeLaunchVisible(null)).toBe(true);
    expect(
      filterLaunchVisibleListings([listing({ expType: "excursion" }), listing({ expType: null })]),
    ).toHaveLength(2);
  });

  it("hides ready excursions when the public catalog launch flag is off", () => {
    flagsMock.FEATURE_PUBLIC_CATALOG = false;

    expect(isReadyExcursionLaunchVisible()).toBe(false);
    expect(
      filterLaunchVisibleListings([
        listing({ detailHref: "/excursions/template-1" }),
      ]),
    ).toEqual([]);
  });

  it("keeps ready excursions when the public catalog launch flag is on", () => {
    expect(
      filterLaunchVisibleListings([
        listing({ detailHref: "/excursions/template-1" }),
      ]),
    ).toHaveLength(1);
  });
});
