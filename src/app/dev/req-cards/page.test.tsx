import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DevReqCardsPage from "./page";

describe("/dev/req-cards", () => {
  it("renders three side-by-side interpretations of neutral group type badges", () => {
    render(<DevReqCardsPage />);

    expect(screen.getByRole("heading", { name: "1 · Тихий чип (контроль)" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "2 · Вес: заливка vs контур" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "3 · Вес + силуэт иконки" })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(12);

    const privateChips = screen.getAllByText("Своя группа").map((label) => label.closest("span"));
    const assemblyChips = screen.getAllByText("Сборная").map((label) => label.closest("span"));

    expect(privateChips).toHaveLength(6);
    expect(assemblyChips).toHaveLength(6);

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
});
