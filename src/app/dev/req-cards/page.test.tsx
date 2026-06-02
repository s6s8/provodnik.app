import { fireEvent, render, screen } from "@testing-library/react";
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
    expect(screen.getByRole("heading", { name: "Текст" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Иконки-only" })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(20);

    const privateChips = screen.getAllByText("Своя группа").map((label) => label.closest("span"));
    const assemblyChips = screen.getAllByText("Сборная").map((label) => label.closest("span"));

    expect(privateChips).toHaveLength(10);
    expect(assemblyChips).toHaveLength(10);

    for (const chip of [...privateChips, ...assemblyChips]) {
      expect(chip).toHaveClass("inline-flex", "items-center", "whitespace-nowrap", "text-ink-2");
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

  it("renders theme icon-only chips with accessible labels and tap-open tooltips", () => {
    render(<DevReqCardsPage />);

    const historyButtons = screen.getAllByRole("button", { name: "История" });
    expect(historyButtons).toHaveLength(3);
    expect(historyButtons[0]).toHaveClass("rounded-full", "text-ink-2");
    expect(historyButtons[0]?.querySelector(".lucide-landmark")).not.toBeNull();
    expect(historyButtons[0]).not.toHaveTextContent("История");

    fireEvent.click(historyButtons[0]);

    expect(screen.getByRole("tooltip")).toHaveTextContent("История");
  });
});
