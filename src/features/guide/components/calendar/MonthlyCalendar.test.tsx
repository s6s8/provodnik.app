import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MonthlyCalendar } from "./MonthlyCalendar";

vi.mock("@/app/(protected)/guide/calendar/actions", () => ({
  blockSlotAction: vi.fn(),
  unblockSlotAction: vi.fn(),
  blockDayAction: vi.fn(),
}));

describe("MonthlyCalendar", () => {
  it("requires an explicit listing selection before opening the day panel", () => {
    render(
      <MonthlyCalendar
        schedules={[]}
        extras={[]}
        departures={[]}
        listings={[
          { id: "listing-1", title: "Обзорная прогулка" },
          { id: "listing-2", title: "Горный маршрут" },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "1" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "listing-2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "1" }));

    expect(screen.getByRole("dialog")).toHaveTextContent("Горный маршрут");
  });
});
