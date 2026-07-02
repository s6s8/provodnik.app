import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DateField } from "./homepage-request-form-classic";

// WB-017 / #9: after a date is picked the trigger must show the formatted
// Russian date, not the «Когда» placeholder.
describe("DateField display", () => {
  it("shows the «Когда» placeholder when no date is selected", () => {
    render(<DateField value="" onChange={vi.fn()} />);
    expect(screen.getByText("Когда")).toBeInTheDocument();
  });

  it("shows the formatted Russian date once a date is selected", () => {
    render(<DateField value="2026-08-15" onChange={vi.fn()} />);
    expect(screen.getByText("15 августа")).toBeInTheDocument();
    // The placeholder text node must be gone (the aria-label stays "Когда").
    expect(screen.queryByText("Когда")).not.toBeInTheDocument();
  });
});
