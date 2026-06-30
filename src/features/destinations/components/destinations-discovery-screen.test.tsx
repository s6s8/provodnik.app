import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DestinationsDiscoveryScreen } from "./destinations-discovery-screen";
import type { DestinationRecord } from "@/data/supabase/queries";

function makeDestination(i: number, overrides: Partial<DestinationRecord> = {}): DestinationRecord {
  return {
    id: `id-${i}`,
    slug: `dest-${i}`,
    name: `Направление ${i}`,
    region: "Россия",
    category: "city",
    description: "",
    heroImageUrl: "/hero.jpg",
    listingCount: 3,
    guidesCount: 2,
    avgRating: 4.5,
    ...overrides,
  };
}

describe("DestinationsDiscoveryScreen", () => {
  it("renders the shared discovery search inside the hero, not below it", () => {
    render(<DestinationsDiscoveryScreen destinations={[makeDestination(0)]} />);

    const search = screen.getByRole("searchbox", { name: "Поиск направления" });
    expect(search).toHaveAttribute("type", "search");

    // Regression guard: search must sit in the hero section, never in the body grid.
    const heroSection = search.closest("section");
    expect(heroSection?.querySelector("h1")?.textContent).toBe("Направления");
  });

  it("shows the load error alert without a search field when loading failed", () => {
    render(<DestinationsDiscoveryScreen destinations={[]} loadError />);

    expect(screen.getByText(/Не удалось загрузить направления/)).toBeInTheDocument();
  });
});
