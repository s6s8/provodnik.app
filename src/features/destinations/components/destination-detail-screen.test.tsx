import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DestinationDetailScreen } from "./destination-detail-screen";
import type { DestinationSummary } from "@/data/destinations/types";
import type { ListingRecord } from "@/data/supabase/queries";

function makeDestination(overrides: Partial<DestinationSummary> = {}): DestinationSummary {
  return {
    slug: "altai",
    name: "Алтай",
    region: "Алтай",
    imageUrl: "/hero.jpg",
    description: "",
    listingCount: 0,
    openRequestCount: 0,
    ...overrides,
  };
}

function makeReadyExcursion(): ListingRecord {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    slug: "11111111-1111-1111-1111-111111111111",
    detailHref: "/excursions/11111111-1111-1111-1111-111111111111",
    title: "Степь и хурул",
    destinationSlug: "kalmykia",
    destinationName: "Элиста",
    destinationRegion: "Калмыкия",
    imageUrl: "/hero-valley.jpg",
    priceRub: 4500,
    durationDays: 1,
    durationLabel: "5 часов",
    groupSize: 8,
    difficulty: "",
    departure: "Элиста",
    format: "group",
    priceScope: "per_group",
    category: "Культура",
    description: "Золотая обитель и степь",
    inclusions: [],
    exclusions: [],
    guideSlug: "adyk",
    guideName: "Адык",
    guideHomeBase: "Элиста",
    rating: 0,
    reviewCount: 0,
    status: "active",
  };
}

describe("DestinationDetailScreen — requests section", () => {
  it("renders a real count when there are open requests", () => {
    const { container } = render(
      <DestinationDetailScreen destination={makeDestination({ openRequestCount: 3 })} />,
    );

    expect(container.textContent).toContain("3 активных запроса");
    expect(container.textContent).not.toContain(
      "Сейчас нет активных запросов по этому направлению.",
    );
  });

  it("renders the empty message when there are no open requests", () => {
    const { container } = render(
      <DestinationDetailScreen destination={makeDestination({ openRequestCount: 0 })} />,
    );

    expect(container.textContent).toContain(
      "Сейчас нет активных запросов по этому направлению.",
    );
  });

  it("points the «Создать запрос» CTA at /", () => {
    const { getByText } = render(
      <DestinationDetailScreen destination={makeDestination()} />,
    );

    expect(getByText("Создать запрос").closest("a")).toHaveAttribute("href", "/");
  });

  it("keeps a ready excursion card on its dedicated detail route", () => {
    render(
      <DestinationDetailScreen
        destination={makeDestination()}
        listings={[makeReadyExcursion()]}
      />,
    );

    expect(screen.getByText("Степь и хурул").closest("a")).toHaveAttribute(
      "href",
      "/excursions/11111111-1111-1111-1111-111111111111",
    );
  });
});
