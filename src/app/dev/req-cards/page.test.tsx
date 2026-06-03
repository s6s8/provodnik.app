import { fireEvent, render, screen, within } from "@testing-library/react";
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
  it("renders three side-by-side interpretations of neutral group type badges", () => {
    render(<DevReqCardsPage />);

    expect(screen.getByRole("heading", { name: "1 · Тихий чип (контроль)" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "2 · Вес: заливка vs контур" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "3 · Вес + силуэт иконки" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "4 · Темы: текст vs иконки-only" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "5 · Контур: цвет рамки = тип" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Текст" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Иконки-only" })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(24);

    const privateChips = screen.getAllByText("Своя группа").map((label) => label.closest("span"));
    const assemblyChips = screen.getAllByText("Сборная").map((label) => label.closest("span"));

    expect(privateChips).toHaveLength(12);
    expect(assemblyChips).toHaveLength(12);

    for (const chip of [...privateChips, ...assemblyChips]) {
      expect(chip).toHaveClass("inline-flex", "items-center", "whitespace-nowrap");
    }

    for (const chip of [...privateChips.slice(0, 10), ...assemblyChips.slice(0, 10)]) {
      expect(chip).toHaveClass("text-ink-2");
    }

    expect(privateChips[0]).toHaveClass("border", "border-border");
    expect(privateChips[0]).not.toHaveClass("bg-surface-low");
    expect(assemblyChips[0]).toHaveClass("border", "border-border");
    expect(assemblyChips[0]).not.toHaveClass("bg-surface-low");

    expect(privateChips[2]).toHaveClass("bg-surface-low");
    expect(privateChips[2]).not.toHaveClass("border");
    expect(assemblyChips[2]).toHaveClass("border", "border-border");
    expect(assemblyChips[2]).not.toHaveClass("bg-surface-low");

    expect(privateChips[4]).toHaveClass("bg-surface-low");
    expect(privateChips[4]?.querySelector(".lucide-users")).not.toBeNull();
    expect(assemblyChips[4]).toHaveClass("border", "border-border");
    expect(assemblyChips[4]?.querySelector(".lucide-users-round")).not.toBeNull();
  });

  it("renders outline-color group type chips with primary only for assembly", () => {
    render(<DevReqCardsPage />);

    const outlineColorSection = screen
      .getByRole("heading", { name: "5 · Контур: цвет рамки = тип" })
      .closest("section");

    expect(outlineColorSection).not.toBeNull();

    const privateChips = within(outlineColorSection!).getAllByText("Своя группа").map((label) => label.closest("span"));
    const assemblyChips = within(outlineColorSection!).getAllByText("Сборная").map((label) => label.closest("span"));

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
      expect(chip?.querySelector(".lucide-users-round")).not.toBeNull();
    }
  });

  it("renders theme icon-only chips with accessible labels and tap-open tooltips", () => {
    render(<DevReqCardsPage />);

    const section4 = screen
      .getByRole("heading", { name: "4 · Темы: текст vs иконки-only" })
      .closest("section");

    expect(section4).not.toBeNull();

    const historyButtons = within(section4!).getAllByRole("button", { name: "История" });
    expect(historyButtons).toHaveLength(3);
    expect(historyButtons[0]).toHaveClass("rounded-full", "text-ink-2");
    expect(historyButtons[0]?.querySelector(".lucide-landmark")).not.toBeNull();
    expect(historyButtons[0]).not.toHaveTextContent("История");

    fireEvent.click(historyButtons[0]);

    expect(screen.getByRole("tooltip")).toHaveTextContent("История");
  });
});
