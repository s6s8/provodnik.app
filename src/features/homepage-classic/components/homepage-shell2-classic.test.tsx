import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ListingRecord, RequestRecord } from "@/data/supabase/queries";

// The hero mounts the whole request form (cmdk, RHF, Supabase client); this file is
// about section ORDER, so stub it down to a marker.
vi.mock("./homepage-hero-form-classic", () => ({
  HomepageHeroFormClassic: () => <div data-testid="hero" />,
}));

import { HomePageShell2Classic } from "./homepage-shell2-classic";

const IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E";

function listing(i: number): ListingRecord {
  return {
    id: `l-${i}`,
    slug: `marshrut-${i}`,
    title: `Маршрут ${i}`,
    destinationSlug: "kalmykia",
    destinationName: "Элиста",
    destinationRegion: "Калмыкия",
    imageUrl: IMAGE,
    priceRub: 4500,
    durationDays: 1,
    durationLabel: "1 день",
    groupSize: 8,
    difficulty: "Лёгкая",
    departure: "Элиста",
    format: "group",
    category: "Культура",
    description: "",
    inclusions: [],
    exclusions: [],
    guideSlug: "bair",
    guideName: "Баир",
    guideHomeBase: "Элиста",
    rating: 0,
    reviewCount: 0,
    status: "active",
  };
}

function request(i: number): RequestRecord {
  return {
    id: `r-${i}`,
    title: "Элиста",
    destination: "Элиста",
    destinationSlug: "elista",
    destinationName: "Элиста",
    destinationRegion: "Калмыкия",
    dateLabel: "10 августа",
    dateFlexibility: "exact",
    budgetRub: 1000,
    groupSize: 3,
    capacity: 6,
    interests: [],
    mode: "assembly",
    format: "group",
    status: "open",
    createdAt: "2026-07-01T00:00:00Z",
    offerCount: 0,
    imageUrl: IMAGE,
    members: [],
    requesterInitials: "ИП",
    description: "",
  } as unknown as RequestRecord;
}

/**
 * Owner 609 asked for ready excursions immediately after the open groups. The two
 * ways to travel sit together; «Как это работает» explains them afterwards.
 */
describe("HomePageShell2Classic section order", () => {
  const WANTED = ["Сборные группы", "Готовые экскурсии", "Как это работает"];

  function order() {
    // A section is matched by aria-label; «Как это работает» is a bare h2. Both
    // can hit for one section (label + inner heading), so drop repeats in place.
    const labels = [...document.querySelectorAll("section, h2")]
      .map((el) => el.getAttribute("aria-label") ?? el.textContent?.trim() ?? "")
      .filter((label) => WANTED.includes(label));
    return labels.filter((label, i) => label !== labels[i - 1]);
  }

  it("puts «Готовые экскурсии» directly after «Сборные группы», before the explainer", () => {
    render(
      <HomePageShell2Classic
        destinations={[]}
        requests={[request(0)]}
        listings={[listing(0), listing(1), listing(2)]}
      />,
    );

    expect(order()).toEqual(["Сборные группы", "Готовые экскурсии", "Как это работает"]);
    expect(screen.getByRole("link", { name: /Готовые экскурсии/ })).toHaveAttribute(
      "href",
      "/listings",
    );
  });

  it("keeps an empty marketplace honest: no groups, no excursions, no placeholders", () => {
    const { container } = render(
      <HomePageShell2Classic destinations={[]} requests={[]} listings={[]} />,
    );

    expect(screen.queryByRole("heading", { name: "Сборные группы" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Готовые экскурсии" })).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/скоро|появятся|пока нет/i);
  });

  it("still renders the excursions block when there are no open groups", () => {
    render(
      <HomePageShell2Classic
        destinations={[]}
        requests={[]}
        listings={[listing(0), listing(1), listing(2)]}
      />,
    );

    expect(order()).toEqual(["Готовые экскурсии", "Как это работает"]);
  });

  it("hides the ready-excursions secondary action when the public catalog is disabled", () => {
    render(
      <HomePageShell2Classic
        destinations={[]}
        requests={[request(0)]}
        listings={[]}
        publicCatalogEnabled={false}
      />,
    );

    expect(screen.queryByRole("link", { name: /Готовые экскурсии/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Все группы/ })).toHaveAttribute("href", "/requests");
  });

  it("shows the ready-excursions secondary action when the public catalog is enabled", () => {
    render(
      <HomePageShell2Classic
        destinations={[]}
        requests={[request(0)]}
        listings={[]}
        publicCatalogEnabled={true}
      />,
    );

    expect(screen.getByRole("link", { name: /Готовые экскурсии/ })).toHaveAttribute(
      "href",
      "/listings",
    );
  });
});
