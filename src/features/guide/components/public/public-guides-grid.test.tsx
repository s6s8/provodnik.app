import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PublicGuidesGrid } from "./public-guides-grid";
import type { GuideRecord } from "@/data/supabase/queries";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function makeGuide(i: number, overrides: Partial<GuideRecord> = {}): GuideRecord {
  return {
    slug: `guide-${i}`,
    fullName: `Гид ${i}`,
    initials: "Г",
    avatarUrl: null,
    rating: 4.9,
    reviewCount: 10,
    experienceYears: 5,
    specialties: ["История"],
    tripsCompleted: 30,
    recommendPct: 98,
    verified: true,
    languages: ["Русский"],
    isPartialMatch: false,
    ...overrides,
  } as GuideRecord;
}

describe("PublicGuidesGrid", () => {
  it("renders the shared discovery search inside the hero", () => {
    render(<PublicGuidesGrid guides={[makeGuide(0)]} activeSpecs={[]} />);

    const search = screen.getByRole("searchbox", { name: "Поиск гида" });
    expect(search).toHaveAttribute("type", "search");

    const heroSection = search.closest("section");
    expect(heroSection?.querySelector("h1")?.textContent).toBe("Гиды");
  });

  it("renders the topic facet rail in the shared discovery toolbar band, not in the results shell", () => {
    render(<PublicGuidesGrid guides={[makeGuide(0)]} activeSpecs={[]} />);

    // The unified toolbar leads with an "Все" facet chip on the bg-surface-low band.
    const allChip = screen.getByRole("button", { name: "Все" });
    expect(allChip.closest(".bg-surface-low")).not.toBeNull();
  });
});
