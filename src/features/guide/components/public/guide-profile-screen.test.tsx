import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GuideProfileScreen } from "./guide-profile-screen";
import type { PublicGuideProfile } from "@/data/public-guides/types";

function makeGuide(overrides: Partial<PublicGuideProfile> = {}): PublicGuideProfile {
  return {
    slug: "ivan-petrov",
    displayName: "Иван Петров",
    headline: "Авторские маршруты по Алтаю",
    homeBase: "Горно-Алтайск",
    verificationStatus: "approved",
    completedTours: 0,
    tripsCompleted: 0,
    recommendPct: null,
    yearsExperience: 3,
    regions: ["Алтай"],
    languages: ["Русский"],
    specialties: ["Треккинг", "Этнотуры"],
    bio: "Вожу группы по горам уже несколько лет.",
    reviewsSummary: { averageRating: 0, totalReviews: 0 },
    ...overrides,
  };
}

describe("GuideProfileScreen", () => {
  it("renders the NewGuideFrame cold-start frame when there are no reviews", () => {
    const { container } = render(<GuideProfileScreen guide={makeGuide()} />);

    expect(container.textContent).toContain("Первые экскурсии");
  });

  it("hides the cold-start frame once the guide has reviews", () => {
    const { container } = render(
      <GuideProfileScreen
        guide={makeGuide({ reviewsSummary: { averageRating: 4.8, totalReviews: 5 } })}
      />,
    );

    expect(container.textContent).not.toContain("Первые экскурсии");
  });

  it("renders specialties without retired tokens or raw rgba classes", () => {
    const { getByText } = render(<GuideProfileScreen guide={makeGuide()} />);

    const specialty = getByText("Треккинг");
    expect(specialty.className).not.toContain("text-ink-2");
    expect(specialty.className).not.toContain("rgba");
  });

  it("renders the avatar as a bounded circle, never as a full-bleed hero image", () => {
    const { container } = render(
      <GuideProfileScreen
        guide={makeGuide({ avatarImageUrl: "https://example.com/avatar.webp" })}
      />,
    );

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img!.className).toContain("rounded-full");
    expect(img!.className).toContain("object-cover");
    expect(img!.className).not.toContain("absolute");
  });

  it("does not render initials as oversized public guide hero artwork", () => {
    const { container } = render(<GuideProfileScreen guide={makeGuide({ avatarInitials: "ИП" })} />);

    const hero = container.querySelector("section");
    expect(hero?.textContent).toContain("Иван Петров");
    expect(hero?.textContent).not.toContain("ИП");
    expect(container.querySelector(".pointer-events-none")).toBeNull();
  });

  it("left-aligns guide description and badge rows instead of centering the profile body", () => {
    const { getByText } = render(<GuideProfileScreen guide={makeGuide()} />);

    const bio = getByText("Вожу группы по горам уже несколько лет.");
    expect(bio.closest("div")?.className).toContain("items-start");
    expect(bio.closest("div")?.className).toContain("text-left");
    expect(getByText("Треккинг").parentElement?.className).toContain("justify-start");
  });

  it("points every request CTA at /?guide=<slug>", () => {
    const { getAllByText } = render(<GuideProfileScreen guide={makeGuide()} />);

    // Hero CTA + the empty-state actions on the excursions and reviews sections.
    const ctas = getAllByText("Запросить этого гида");
    expect(ctas).toHaveLength(3);
    for (const cta of ctas) {
      expect(cta.closest("a")).toHaveAttribute("href", "/?guide=ivan-petrov");
    }
  });
});
