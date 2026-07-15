import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { DestinationOption, GuideRecord, ListingRecord } from "@/data/supabase/queries";
import type { HomepageReview } from "@/lib/supabase/homepage";

import {
  HOMEPAGE_MIN,
  HomepageInventoryClassic,
} from "./homepage-inventory-classic";

const IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E";

function listing(i: number): ListingRecord {
  return {
    id: `l-${i}`,
    slug: `marshrut-${i}`,
    title: `Маршрут ${i}`,
    destinationSlug: "altai",
    destinationName: "Барнаул",
    destinationRegion: "Алтай",
    imageUrl: IMAGE,
    priceRub: 5000,
    durationDays: 1,
    durationLabel: "1 день",
    groupSize: 6,
    difficulty: "Лёгкая",
    departure: "Барнаул",
    format: "group",
    category: "История",
    description: "Описание",
    inclusions: [],
    exclusions: [],
    guideSlug: "anna",
    guideName: "Анна",
    guideHomeBase: "Барнаул",
    rating: 4.9,
    reviewCount: 12,
    status: "active",
  };
}

function destination(i: number): DestinationOption {
  return { name: `Город ${i}`, region: "Алтай", guideCount: i + 1 };
}

function guide(i: number): GuideRecord {
  return {
    id: `g-${i}`,
    slug: `gid-${i}`,
    fullName: `Гид ${i}`,
    initials: "ГИ",
    homeBase: "Алтай",
    bio: "Био",
    destinations: ["Алтай"],
    destinationSlugs: ["altai"],
    rating: 4.8,
    reviewCount: 5,
    experienceYears: 7,
    isPartialMatch: false,
    specialties: [],
    specializations: [],
    baseCity: "Барнаул",
    tripsCompleted: 3,
    recommendPct: 95,
    verified: true,
    languages: ["русский"],
  };
}

function review(i: number): HomepageReview {
  return {
    id: `r-${i}`,
    authorName: `Путешественник ${i}`,
    authorInitials: "ПТ",
    rating: 5,
    title: `Отзыв ${i}`,
    body: `Текст отзыва ${i}`,
    createdAt: "2026-07-01T00:00:00Z",
    guideName: `Гид ${i}`,
    guideSlug: `gid-${i}`,
  };
}

function build<T>(factory: (i: number) => T, count: number): T[] {
  return Array.from({ length: count }, (_, i) => factory(i));
}

function renderInventory(overrides: {
  listings?: number;
  destinations?: number;
  guides?: number;
  reviews?: number;
}) {
  return render(
    <HomepageInventoryClassic
      listings={build(listing, overrides.listings ?? 0)}
      destinations={build(destination, overrides.destinations ?? 0)}
      guides={build(guide, overrides.guides ?? 0)}
      reviews={build(review, overrides.reviews ?? 0)}
    />,
  );
}

const heading = (name: string) => screen.queryByRole("heading", { name });

describe("HomepageInventoryClassic min-count gates", () => {
  const blocks = [
    { key: "listings", title: "Готовые экскурсии", min: HOMEPAGE_MIN.listings },
    { key: "destinations", title: "Популярные направления", min: HOMEPAGE_MIN.destinations },
    { key: "guides", title: "Гиды", min: HOMEPAGE_MIN.guides },
    { key: "reviews", title: "Отзывы", min: HOMEPAGE_MIN.reviews },
  ] as const;

  for (const block of blocks) {
    it(`«${block.title}» renders nothing below ${block.min} items`, () => {
      renderInventory({ [block.key]: block.min - 1 });

      expect(heading(block.title)).not.toBeInTheDocument();
    });

    it(`«${block.title}» renders at ${block.min} items`, () => {
      renderInventory({ [block.key]: block.min });

      expect(heading(block.title)).toBeInTheDocument();
    });
  }

  it("renders no placeholder, skeleton or coming-soon copy on an empty marketplace", () => {
    const { container } = renderInventory({});

    for (const block of blocks) {
      expect(heading(block.title)).not.toBeInTheDocument();
    }
    expect(container.textContent).not.toMatch(/скоро|появятся|пока нет|загруж/i);
    expect(container.querySelectorAll("[data-slot='skeleton']")).toHaveLength(0);
  });

  it("shows the curated FAQ regardless of inventory", () => {
    renderInventory({});

    expect(heading("Вопросы и ответы")).toBeInTheDocument();
    expect(screen.getByText("Как отправить заявку гиду?")).toBeInTheDocument();
  });

  it("links the excursions block into the public catalog", () => {
    renderInventory({ listings: HOMEPAGE_MIN.listings });

    expect(screen.getByRole("link", { name: /Все экскурсии/ })).toHaveAttribute(
      "href",
      "/listings",
    );
  });
});
