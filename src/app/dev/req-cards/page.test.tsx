import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DevReqCardsPage from "./page";

describe("/dev/req-cards", () => {
  it("renders group type as neutral outlined icon chips", () => {
    render(<DevReqCardsPage />);

    const privateChip = screen.getAllByText("Своя группа")[0].closest("span");
    const assemblyChip = screen.getAllByText("Сборная")[0].closest("span");

    expect(privateChip).toHaveClass(
      "inline-flex",
      "items-center",
      "gap-1",
      "whitespace-nowrap",
      "rounded-full",
      "border",
      "border-border",
      "text-ink-2",
    );
    expect(privateChip).not.toHaveClass("bg-surface-low");
    expect(privateChip?.querySelector("svg")).not.toBeNull();

    expect(assemblyChip).toHaveClass("border", "border-border", "whitespace-nowrap", "text-ink-2");
    expect(assemblyChip).not.toHaveClass("bg-surface-low");
    expect(assemblyChip?.querySelector("svg")).not.toBeNull();
  });
});
