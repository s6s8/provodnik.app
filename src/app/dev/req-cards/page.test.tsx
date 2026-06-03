import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import DevReqCardsPage from "./page";

beforeAll(() => {
  class ResizeObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }

  globalThis.ResizeObserver = ResizeObserverMock;
});

describe("/dev/req-cards", () => {
  it("renders only the retained production bundle and the participant-count prototype bundle", () => {
    render(<DevReqCardsPage />);

    expect(screen.getByRole("heading", { name: "5 · Контур: цвет рамки = тип" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "6 · Аватары + счётчик участников" })).toBeInTheDocument();
  });

  it("renders outline-color group type chips with primary only for assembly", () => {
    render(<DevReqCardsPage />);

    const outlineColorSection = screen
      .getByRole("heading", { name: "5 · Контур: цвет рамки = тип" })
      .closest("section");

    expect(outlineColorSection).not.toBeNull();

    const privateChips = within(outlineColorSection!).getAllByText("Своя группа").map((label) => label.closest("span"));
    const assemblyChips = within(outlineColorSection!).getAllByText("Открытая").map((label) => label.closest("span"));

    expect(privateChips).toHaveLength(2);
    expect(assemblyChips).toHaveLength(2);

    for (const chip of privateChips) {
      expect(chip).toHaveClass("border", "border-border", "text-ink-2");
      expect(chip).not.toHaveClass("bg-surface-low", "border-primary/40", "text-primary");
      expect(chip?.querySelector(".lucide-users")).not.toBeNull();
    }

    for (const chip of assemblyChips) {
      expect(chip).toHaveClass("border", "border-primary/40", "text-primary");
      expect(chip).not.toHaveClass("bg-surface-low", "border-border", "text-ink-2");
      expect(chip?.querySelector(".lucide-users")).not.toBeNull();
    }
  });

  it("renders participant counts without capacity text in the prototype bundle", () => {
    render(<DevReqCardsPage />);

    const countSection = screen
      .getByRole("heading", { name: "6 · Аватары + счётчик участников" })
      .closest("section");

    expect(countSection).not.toBeNull();

    const soloCard = within(countSection!)
      .getByRole("link", { name: /Мцхета/ })
      .closest("article");
    const largeCard = within(countSection!)
      .getByRole("link", { name: /Кахетия/ })
      .closest("article");

    expect(soloCard).not.toBeNull();
    expect(largeCard).not.toBeNull();

    expect(within(soloCard!).getAllByTestId("participant-avatar")).toHaveLength(1);
    expect(within(soloCard!).queryByText("1")).not.toBeInTheDocument();
    expect(within(largeCard!).getAllByTestId("participant-avatar")).toHaveLength(3);
    expect(within(largeCard!).getByText("40")).toBeInTheDocument();
    expect(countSection).not.toHaveTextContent("из");
    expect(countSection).not.toHaveTextContent("/");
  });
});
