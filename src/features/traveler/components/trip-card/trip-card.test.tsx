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

  it("does NOT render meeting point on 'upcoming' if more than 48h away", () => {
    const farFuture = new Date(Date.now() + 72 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);
    render(
      <TripCard
        phase="upcoming"
        trip={{
          ...baseTrip,
          startsOn: farFuture,
          routeStops: [{ photoUrl: "/r.jpg", address: "ул. Ленина, 1" }],
        }}
      />,
    );
    expect(screen.queryByText("ул. Ленина, 1")).toBeNull();
  });

  it("renders meeting point on 'upcoming' within 48h window", () => {
    const soon = new Date(Date.now() + 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);
    render(
      <TripCard
        phase="upcoming"
        trip={{
          ...baseTrip,
          startsOn: soon,
          routeStops: [{ photoUrl: "/r.jpg", address: "ул. Ленина, 1" }],
        }}
      />,
    );
    expect(screen.getByText("ул. Ленина, 1")).toBeInTheDocument();
  });

  it("always renders meeting point on 'today'", () => {
    const today = new Date().toISOString().slice(0, 10);
    render(
      <TripCard
        phase="today"
        trip={{
          ...baseTrip,
          startsOn: today,
          routeStops: [{ photoUrl: "/r.jpg", address: "ул. Ленина, 1" }],
        }}
      />,
    );
    expect(screen.getByText("ул. Ленина, 1")).toBeInTheDocument();
  });

  it("renders 6 booking elements on 'upcoming' with a confirmed offer", () => {
    render(
      <TripCard
        phase="upcoming"
        trip={{
          ...baseTrip,
          routeStops: [
            { photoUrl: "/r1.jpg" },
            { photoUrl: "/r2.jpg" },
            { photoUrl: "/r3.jpg" },
          ],
          inclusions: ["трансфер", "обед", "входные билеты"],
          guideName: "Алдар Б.",
          guideAvatarUrl: "/a/aldar.jpg",
          price: { amount: 300000, currency: "RUB" },
        }}
      />,
    );
    expect(screen.getByText(/трансфер/)).toBeInTheDocument();
    expect(screen.getByText("Алдар Б.")).toBeInTheDocument();
    expect(screen.getByText(/Написать гиду/)).toBeInTheDocument();
  });

  it("shows organizer line for a joined-assembly card", () => {
    render(
      <TripCard
        phase="upcoming"
        trip={{
          ...baseTrip,
          isOwnRequest: false,
          organizerName: "Мария К.",
        }}
      />,
    );
    expect(
      screen.getByText("Сборная группа · организатор: Мария К."),
    ).toBeInTheDocument();
  });

  it("shows «Оставить отзыв» for completed without review", () => {
    render(
      <TripCard
        phase="completed"
        trip={{ ...baseTrip, hasReview: false }}
      />,
    );
    expect(screen.getByText("Оставить отзыв")).toBeInTheDocument();
  });

  it("shows «Ваш отзыв · ★ N» for completed with review", () => {
    render(
      <TripCard
        phase="completed"
        trip={{ ...baseTrip, hasReview: true, reviewRating: 5 }}
      />,
    );
    expect(screen.getByText("Ваш отзыв · ★ 5")).toBeInTheDocument();
  });
});
