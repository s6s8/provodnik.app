import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PublicListingDiscoveryScreen } from "./public-listing-discovery-screen";
import type { PublicListing } from "@/data/public-listings/types";

function makeListing(i: number, overrides: Partial<PublicListing> = {}): PublicListing {
  return {
    slug: `listing-${i}`,
    title: `Экскурсия ${i}`,
    city: "Казань",
    region: "Татарстан",
    durationDays: 1,
    priceFromRub: 5000,
    groupSizeMax: 8,
    themes: ["history_culture"],
    highlights: ["Кремль", "Старый город"],
    itinerary: [],
    inclusions: ["Работа гида"],
    guideSlug: "guide-1",
    guideName: "Иван",
    rating: 4.8,
    reviewCount: 12,
    ...overrides,
  };
}

describe("PublicListingDiscoveryScreen", () => {
  it("renders the shared discovery search inside the hero", () => {
    render(<PublicListingDiscoveryScreen listings={[makeListing(0)]} />);

    const search = screen.getByRole("searchbox", { name: "Поиск по экскурсиям" });
    expect(search).toHaveAttribute("type", "search");

    // Search lives in the hero section (same section as the H1), not in the body.
    const heroSection = search.closest("section");
    expect(heroSection?.querySelector("h1")?.textContent).toBe("Экскурсии");
  });

  it("renders the theme filter pills in the shared DiscoveryFilterBar, not in the results shell", () => {
    render(<PublicListingDiscoveryScreen listings={[makeListing(0)]} />);

    const allPill = screen.getByRole("button", { name: /Все/ });
    // The tinted DiscoveryFilterBar strip uses bg-surface-low.
    expect(allPill.closest(".bg-surface-low")).not.toBeNull();
  });
});
