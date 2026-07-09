import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GuideOfferCard, type GuideCardInfo } from "./guide-offer-card";

const baseGuide: GuideCardInfo = {
  full_name: "Иван Петров",
  avatar_url: null,
  rating: 4.8,
  review_count: 12,
  verified: true,
  years_experience: 7,
  trips_completed: 34,
  recommend_pct: 96,
  languages: ["Русский", "Английский"],
  specialties: ["История", "Культура"],
};

function renderCard(props: Partial<React.ComponentProps<typeof GuideOfferCard>> = {}) {
  return render(
    <GuideOfferCard
      guide={baseGuide}
      name="Иван Петров"
      perPersonPriceLabel="2 500 ₽"
      {...props}
    />,
  );
}

const OFF_PALETTE = /sky-|purple-|emerald-|blue-[0-9]|slate-[0-9]/;

describe("GuideOfferCard", () => {
  it("renders responseTimeLabel when provided", () => {
    renderCard({ responseTimeLabel: "Отвечает в течение часа" });
    expect(screen.getByText("Отвечает в течение часа")).toBeInTheDocument();
  });

  it("renders profileHref as a link with «Профиль →»", () => {
    renderCard({ profileHref: "/guides/ivan" });
    const link = screen.getByRole("link", { name: /Профиль/ });
    expect(link).toHaveAttribute("href", "/guides/ivan");
    expect(link).toHaveTextContent("Профиль →");
  });

  it("renders requestBudgetLabel as muted text", () => {
    renderCard({ requestBudgetLabel: "Бюджет заявки: 2 000 ₽" });
    const budget = screen.getByText("Бюджет заявки: 2 000 ₽");
    expect(budget).toBeInTheDocument();
    expect(budget.className).toContain("text-muted-foreground");
  });

  it("renders groupTotalLabel below the per-person price", () => {
    renderCard({ groupTotalLabel: "5 000 ₽ за группу" });
    expect(screen.getByText(/5 000 ₽ за группу/)).toBeInTheDocument();
  });

  it("shows the «Новый гид» note and suppresses the stats row for a new guide", () => {
    renderCard({
      isNewGuide: true,
      guide: {
        ...baseGuide,
        rating: null,
        review_count: 0,
        trips_completed: 0,
        recommend_pct: null,
      },
    });
    expect(screen.getByText("Новый гид — первые поездки")).toBeInTheDocument();
    expect(screen.queryByText(/рекомендуют/)).not.toBeInTheDocument();
    expect(screen.queryByText(/отзыв/)).not.toBeInTheDocument();
  });

  it("shows the recommend percentage with the review denominator when review_count >= 3", () => {
    renderCard({ guide: { ...baseGuide, recommend_pct: 96, review_count: 12 } });
    expect(screen.getByText(/96% рекомендуют \(из 12 отзывов\)/)).toBeInTheDocument();
  });

  it("suppresses the recommend percentage when review_count < 3", () => {
    renderCard({ guide: { ...baseGuide, recommend_pct: 96, review_count: 2 } });
    expect(screen.queryByText(/рекомендуют/)).not.toBeInTheDocument();
  });

  it("bolds matching specialties", () => {
    renderCard({
      guide: { ...baseGuide, specialties: ["История", "Культура", "Еда"] },
      matchingSpecialties: ["История"],
    });
    const matched = screen.getByText("История");
    expect(matched.className).toContain("font-bold");
    const unmatched = screen.getByText("Культура");
    expect(unmatched.className).not.toContain("font-bold");
  });

  it("applies the canon gradient class when selected", () => {
    const { container } = renderCard({ selected: true });
    const article = container.querySelector("article");
    expect(article?.className).toContain("from-surface");
    expect(article?.className).toContain("to-primary-tint/30");
  });

  it("shows the contacts disclosure beneath the CTA when onSelect is provided", () => {
    renderCard({ onSelect: vi.fn() });
    expect(screen.getByText("после выбора откроются контакты и чат")).toBeInTheDocument();
  });

  it("renders «Не подходит» only when onReject is provided", () => {
    const { rerender } = renderCard();
    expect(screen.queryByText("Не подходит")).not.toBeInTheDocument();

    rerender(
      <GuideOfferCard
        guide={baseGuide}
        name="Иван Петров"
        perPersonPriceLabel="2 500 ₽"
        onReject={vi.fn()}
      />,
    );
    expect(screen.getByText("Не подходит")).toBeInTheDocument();
  });

  it("renders no off-palette utility classes", () => {
    const { container } = renderCard({
      selected: true,
      isLocal: true,
      responseTimeLabel: "Отвечает быстро",
      profileHref: "/guides/ivan",
      requestBudgetLabel: "Бюджет: 2 000 ₽",
      groupTotalLabel: "5 000 ₽ за группу",
      matchingSpecialties: ["История"],
      onSelect: vi.fn(),
      onReject: vi.fn(),
    });
    expect(container.innerHTML).not.toMatch(OFF_PALETTE);
  });
});
