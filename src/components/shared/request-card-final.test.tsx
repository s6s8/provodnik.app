import { fireEvent, render, screen } from "@testing-library/react";
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
        interests={["food", "history", "unknown-interest"]}
        members={[
          { id: "tamar", displayName: "Тамар", initials: "Т" },
          { id: "oleg", displayName: "Олег", initials: "О" },
        ]}
        price="6 800 ₽ / чел"
      />,
    );

    expect(screen.getByRole("link", { name: /Кахетия/ })).toHaveAttribute("href", "/requests/kakheti");
    expect(screen.getByText("Гид найден").closest("span")).toHaveClass("bg-success/10", "text-success");
    expect(screen.getByText("Открытая").closest("span")).toHaveClass("border-primary/40", "text-primary");
    expect(screen.getByText("Гибкие даты")).toBeInTheDocument();
    expect(screen.getByText("5 июля, 11:30")).toBeInTheDocument();
    expect(screen.queryByText(/2\s*\/\s*\d+/)).not.toBeInTheDocument();
    expect(screen.queryByText(/2 чел/)).not.toBeInTheDocument();
    const price = screen.getByText("6 800 ₽ / чел");
    expect(price).toBeInTheDocument();
    expect(price).toHaveClass("shrink-0", "whitespace-nowrap");

    const foodChip = screen.getByRole("button", { name: "Гастрономия" });
    expect(foodChip).not.toHaveTextContent("Гастрономия");
    const bottomRow = price.parentElement;
    expect(bottomRow).toContainElement(screen.getByTitle("Тамар"));
    expect(bottomRow).toContainElement(foodChip);

    fireEvent.click(foodChip);

    expect(screen.getByRole("tooltip")).toHaveTextContent("Гастрономия");
  });

  it("renders private waiting cards with the neutral group outline", () => {
    render(
      <RequestCardFinal
        href="/requests/tbilisi"
        location="Тбилиси"
        date="12 июня"
        groupType="private"
        guideState="waiting"
        interests={["history"]}
        members={[]}
        price="По договоренности"
      />,
    );

    expect(screen.getByText("Ждёт гида").closest("span")).toHaveClass("bg-warning/10", "text-warning");
    expect(screen.getByText("Своя группа").closest("span")).toHaveClass("border-border", "text-ink-2");
    expect(screen.queryByText("Гибкие даты")).not.toBeInTheDocument();
    expect(screen.getByText("По договоренности")).toBeInTheDocument();
  });
});
