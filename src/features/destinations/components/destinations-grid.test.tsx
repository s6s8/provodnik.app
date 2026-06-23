import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DestinationsGrid } from "./destinations-grid";
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

describe("DestinationsGrid", () => {
  it("renders all destinations without capping at 5", () => {
    const destinations = Array.from({ length: 8 }, (_, i) => makeDestination(i));

    const { container } = render(<DestinationsGrid destinations={destinations} />);

    expect(
      container.querySelectorAll('[data-slot="destination-card"]')
    ).toHaveLength(8);
  });

  it("renders no rating star when avgRating is null", () => {
    const destinations = [makeDestination(0, { avgRating: null })];

    const { container } = render(<DestinationsGrid destinations={destinations} />);

    expect(
      container.querySelector('[data-slot="destination-rating"]')
    ).toBeNull();
  });

  it("shows an empty state when there are no destinations", () => {
    const { container } = render(<DestinationsGrid destinations={[]} />);

    expect(
      container.querySelector('[data-slot="destination-card"]')
    ).toBeNull();
    expect(container.textContent).toContain("Пока нет доступных направлений");
  });
});
