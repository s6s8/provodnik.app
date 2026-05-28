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

  it("renders the accepted-offer route photo for phase 'upcoming'", () => {
    render(
      <TripCard
        phase="upcoming"
        trip={{
          ...baseTrip,
          routeStops: [{ photoUrl: "/photos/route1.jpg" }],
        }}
      />,
    );
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "/photos/route1.jpg",
    );
  });

  it("renders mosaic of 3 thumbs for phase 'awaiting_decision'", () => {
    render(
      <TripCard
        phase="awaiting_decision"
        trip={{
          ...baseTrip,
          topOffersPhotos: ["/o1.jpg", "/o2.jpg", "/o3.jpg"],
        }}
      />,
    );
    expect(screen.getAllByRole("img")).toHaveLength(3);
  });

  it("fills mosaic with greyed placeholders when fewer offers", () => {
    render(
      <TripCard
        phase="awaiting_decision"
        trip={{ ...baseTrip, topOffersPhotos: ["/o1.jpg"] }}
      />,
    );
    expect(screen.getAllByTestId(/photo-slot/)).toHaveLength(3);
  });

  it("renders destination city photo for phase 'waiting_offers'", () => {
    render(
      <TripCard
        phase="waiting_offers"
        trip={{ ...baseTrip, destinationCityPhotoUrl: "/cities/elista.jpg" }}
      />,
    );
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "/cities/elista.jpg",
    );
  });

  it("falls back to a grey block when waiting_offers has no city photo", () => {
    render(
      <TripCard
        phase="waiting_offers"
        trip={{ ...baseTrip, destinationCityPhotoUrl: null }}
      />,
    );
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByTestId("photo-fallback")).toBeInTheDocument();
  });
});
