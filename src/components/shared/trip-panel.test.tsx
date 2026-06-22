import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TripPanel } from "./trip-panel";

describe("TripPanel", () => {
  it("renders the eyebrow with text-primary", () => {
    render(<TripPanel dateLabel="12 июля" />);

    const eyebrow = screen.getByText("Детали поездки");
    expect(eyebrow).toHaveClass("text-primary");
  });

  it("renders the enrollmentLabel pill when provided", () => {
    render(
      <TripPanel dateLabel="12 июля" enrollmentLabel="Набор открыт" enrollmentOpen />,
    );

    expect(screen.getByText("Набор открыт")).toBeInTheDocument();
  });

  it("still renders with the legacy status prop without crashing", () => {
    render(
      <TripPanel
        dateLabel="12 июля"
        status={{ open: true, label: "Группа открыта" }}
        seatsTaken={2}
        seatsTotal={6}
      />,
    );

    expect(screen.getByText("Группа открыта")).toBeInTheDocument();
  });

  it("renders the price slot with extrabold 25px styling", () => {
    const { container } = render(<TripPanel dateLabel="12 июля" price="4 500 ₽" />);

    const price = container.querySelector(".font-extrabold.text-\\[25px\\]");
    expect(price).toBeInTheDocument();
    expect(price).toHaveTextContent("4 500 ₽");
  });
});
