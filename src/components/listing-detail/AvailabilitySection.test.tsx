import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AvailabilitySection, type ListingSlotRow } from "./AvailabilitySection";

const slot = (overrides: Partial<ListingSlotRow> = {}): ListingSlotRow => ({
  id: "slot-1",
  starts_at: "2026-09-15T07:00:00.000Z",
  ends_at: "2026-09-15T11:00:00.000Z",
  capacity: 8,
  seats_taken: 2,
  status: "open",
  ...overrides,
});

describe("AvailabilitySection", () => {
  it("renders the nearest date and remaining seats when slots are present", () => {
    render(<AvailabilitySection slots={[slot()]} />);

    expect(screen.getByText("15 сентября")).toBeInTheDocument();
    expect(screen.getByText(/6 из 8 мест/)).toBeInTheDocument();
    expect(screen.queryByText("Даты — по запросу")).not.toBeInTheDocument();
  });

  it("omits seats when capacity is null but still shows the date", () => {
    render(<AvailabilitySection slots={[slot({ capacity: null })]} />);

    expect(screen.getByText("15 сентября")).toBeInTheDocument();
    expect(screen.queryByText(/мест/)).not.toBeInTheDocument();
  });

  it("renders an honest fallback when there are no slots", () => {
    render(<AvailabilitySection slots={[]} />);

    expect(screen.getByText("Даты — по запросу")).toBeInTheDocument();
  });
});
