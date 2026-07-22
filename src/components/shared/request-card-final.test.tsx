import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { RequestCardFinal } from "./request-card-final";

beforeAll(() => {
  class ResizeObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }

  globalThis.ResizeObserver = ResizeObserverMock;
});

describe("RequestCardFinal", () => {
  it("renders the Section 5 visual contract without capacity text", () => {
    render(
      <RequestCardFinal
        href="/requests/kakheti"
        location="Кахетия"
        date="5 июля, 11:30"
        groupType="assembly"
        guideState="found"
        datesFlexible
        timeFlexible
        interests={["food", "history_culture", "unknown-interest"]}
        members={[
          { id: "tamar", displayName: "Тамар", initials: "Т" },
          { id: "oleg", displayName: "Олег", initials: "О" },
        ]}
        price="6 800 ₽ / чел"
        groupPrice="~13 600 ₽ за группу"
      />,
    );

    expect(screen.getByRole("link", { name: /Кахетия/ })).toHaveAttribute("href", "/requests/kakheti");
    expect(screen.getByText("Гид найден").closest("span")).toHaveClass("bg-success/10", "text-success");
    expect(screen.getByText("Сборная группа").closest("span")).toHaveClass("bg-primary-tint", "text-primary");
    expect(screen.getByText("Гибкие даты")).toBeInTheDocument();
    expect(screen.getByText("Гибкое время")).toBeInTheDocument();
    expect(screen.getByText("5 июля, 11:30")).toBeInTheDocument();
    expect(screen.queryByText(/2\s*\/\s*\d+/)).not.toBeInTheDocument();
    expect(screen.getByText(/·\s*от\s*2\s*чел\./)).toBeInTheDocument();
    const price = screen.getByText("6 800 ₽ / чел");
    expect(price).toBeInTheDocument();
    expect(price).toHaveClass("shrink-0", "whitespace-nowrap");
    const groupPrice = screen.getByText("~13 600 ₽ за группу");
    expect(groupPrice).toBeInTheDocument();
    expect(groupPrice).toHaveClass("shrink-0", "whitespace-nowrap");

    const foodChip = screen.getByText("Гастрономия").closest("span");
    expect(foodChip).toHaveClass("border", "border-border", "text-ink-2");
    const priceColumn = price.parentElement;
    expect(priceColumn).toContainElement(price);
    expect(priceColumn).toContainElement(groupPrice);
    const bottomRow = priceColumn?.parentElement;
    expect(screen.queryByTitle("Тамар")).not.toBeInTheDocument();
    expect(bottomRow).toContainElement(price);
    expect(bottomRow).not.toContainElement(foodChip);
  });

  it("renders private waiting cards with the neutral group outline", () => {
    render(
      <RequestCardFinal
        href="/requests/tbilisi"
        location="Тбилиси"
        date="12 июня"
        groupType="private"
        guideState="waiting"
        interests={["history_culture"]}
        members={[]}
        price="По договоренности"
      />,
    );

    expect(screen.getByText("Ждёт гида").closest("span")).toHaveClass("bg-amber-tint", "text-warning-text");
    expect(screen.getByText("Своя группа").closest("span")).toHaveClass("bg-gold-50", "text-warning-text");
    expect(screen.getByText(/·\s*0\s*чел\./)).toBeInTheDocument();
    expect(screen.queryByText("Гибкие даты")).not.toBeInTheDocument();
    expect(screen.getByText("По договоренности")).toBeInTheDocument();
    expect(screen.queryByText(/₽ за группу/)).not.toBeInTheDocument();
  });
});
