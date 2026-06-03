import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TourItineraryDisplay } from "./TourItineraryDisplay";

describe("TourItineraryDisplay", () => {
  it("exposes itinerary disclosure state and controlled panel", () => {
    render(
      <TourItineraryDisplay
        days={[
          {
            listing_id: "listing-1",
            day_number: 1,
            title: "Переезд",
            body: "Маршрут первого дня",
            date_override: null,
          },
        ]}
      />,
    );

    const dayButton = screen.getByRole("button", { name: /День 1: Переезд/ });

    expect(dayButton).toHaveAttribute("aria-expanded", "false");
    expect(dayButton).toHaveAttribute("aria-controls", "tour-itinerary-day-1-panel");

    fireEvent.click(dayButton);

    const panel = document.getElementById("tour-itinerary-day-1-panel");

    expect(dayButton).toHaveAttribute("aria-expanded", "true");
    expect(panel).toHaveTextContent("Маршрут первого дня");
  });
});
