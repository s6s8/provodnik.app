import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { TripCardModel } from "../trip-card/trip-card-types";

import { CabinetSection } from "./cabinet-section";

function makeTrips(n: number): TripCardModel[] {
  return Array.from({ length: n }, (_, i) => ({
    id: String(i),
    destination: "Элиста",
    startsOn: "2026-09-10",
    isOwnRequest: true,
    guideName: null,
    guideAvatarUrl: null,
    organizerName: null,
  }));
}

describe("CabinetSection", () => {
  it("renders header with counter «Скоро · 7»", () => {
    render(
      <CabinetSection phase="upcoming" label="Скоро" trips={makeTrips(7)} />,
    );

    expect(screen.getByText("Скоро · 7")).toBeInTheDocument();
  });

  it("shows only 5 cards + «Показать все 7» for 'upcoming' with 7", () => {
    render(
      <CabinetSection phase="upcoming" label="Скоро" trips={makeTrips(7)} />,
    );

    expect(screen.getAllByTestId("trip-card")).toHaveLength(5);
    expect(screen.getByText("Показать все 7")).toBeInTheDocument();
  });

  it("expands to all cards after clicking «Показать все»", () => {
    render(
      <CabinetSection phase="upcoming" label="Скоро" trips={makeTrips(7)} />,
    );

    fireEvent.click(screen.getByText("Показать все 7"));

    expect(screen.getAllByTestId("trip-card")).toHaveLength(7);
  });

  it("shows all cards (no limit) for 'awaiting_decision'", () => {
    render(
      <CabinetSection
        phase="awaiting_decision"
        label="Ждут вашего решения"
        trips={makeTrips(7)}
      />,
    );

    expect(screen.getAllByTestId("trip-card")).toHaveLength(7);
    expect(screen.queryByText(/Показать все/)).toBeNull();
  });

  it("'completed' is collapsed by default — no cards in DOM, header click expands", () => {
    render(
      <CabinetSection
        phase="completed"
        label="Завершённые"
        trips={makeTrips(12)}
      />,
    );

    expect(screen.queryAllByTestId("trip-card")).toHaveLength(0);
    expect(screen.getByText("Завершённые · 12")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Завершённые · 12"));

    expect(screen.getAllByTestId("trip-card")).toHaveLength(12);
  });
});
