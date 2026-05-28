import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { TripCard } from "./trip-card";
import type { TripCardModel } from "./trip-card-types";

const baseTrip: TripCardModel = {
  id: "t1",
  destination: "Элиста",
  startsOn: "2026-09-10",
  isOwnRequest: true,
  guideName: null,
  guideAvatarUrl: null,
  organizerName: null,
};

describe("TripCard", () => {
  it.each([
    ["today", "today"],
    ["upcoming", "upcoming"],
    ["awaiting_decision", "awaiting_decision"],
    ["waiting_offers", "waiting_offers"],
    ["completed", "completed"],
  ] as const)("renders without crash in phase %s", (phase, expectedPhase) => {
    expect(phase).toBe(expectedPhase);
    render(<TripCard phase={phase} trip={baseTrip} />);
    expect(screen.getByText("Элиста")).toBeInTheDocument();
  });
});
