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

  it("does not render any photo block on the waiting_offers phase", () => {
    render(
      <TripCard
        phase="waiting_offers"
        trip={{
          id: "r3",
          destination: "Элиста",
          startsOn: "2026-07-01",
          isOwnRequest: true,
          guideName: null,
          guideAvatarUrl: null,
          organizerName: null,
          destinationCityPhotoUrl: null,
        }}
      />,
    );
    expect(screen.queryByText("фото скоро")).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Элиста")).toBeInTheDocument();
  });

  it("renders «+ к группе» and «± даты» pills for a waiting_offers own request with both flags", () => {
    render(
      <TripCard
        phase="waiting_offers"
        trip={{
          id: "r1",
          destination: "Москва",
          startsOn: "2026-07-01",
          isOwnRequest: true,
          guideName: null,
          guideAvatarUrl: null,
          organizerName: null,
          openToJoin: true,
          datesFlexible: true,
        }}
      />,
    );
    expect(screen.getByText("+ к группе")).toBeInTheDocument();
    expect(screen.getByText("± даты")).toBeInTheDocument();
  });

  it("renders request facts and links a waiting_offers card to the request detail page", () => {
    render(
      <TripCard
        phase="waiting_offers"
        trip={{
          id: "request-42",
          destination: "Липецк",
          startsOn: "2026-07-01",
          endsOn: "2026-07-03",
          budget: { amount: 1250000, currency: "RUB" },
          participantsCount: 5,
          isOwnRequest: true,
          guideName: null,
          guideAvatarUrl: null,
          organizerName: null,
          openToJoin: true,
          datesFlexible: true,
          groupType: "assembly",
          createdAt: "2026-06-03T10:25:00.000Z",
        }}
      />,
    );

    const cardLink = screen.getByRole("link", { name: /Липецк/ });
    expect(cardLink).toHaveAttribute("href", "/requests/request-42");
    expect(screen.getByText("1 июля 2026 – 3 июля 2026")).toBeInTheDocument();
    const budgetLabel = new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 0,
    }).format(12500);
    expect(
      screen.getByText((_, element) =>
        Boolean(element?.textContent === budgetLabel),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("5 человек")).toBeInTheDocument();
    expect(screen.getByText("Сборная группа")).toBeInTheDocument();
    expect(screen.getByText("+ к группе")).toBeInTheDocument();
    expect(screen.getByText("± даты")).toBeInTheDocument();
    // createdAt is 10:25Z; the suite pins TZ=UTC (see package.json test scripts)
    // so this wall-clock assertion is deterministic across local + CI.
    const publishedAt = screen.getByText(/^Опубликован: 3 июн\.?, 10:25$/);
    const metaRow = publishedAt.parentElement;
    expect(publishedAt).toHaveClass("text-xs", "text-muted-foreground");
    expect(metaRow).toHaveClass("flex", "flex-row", "justify-between");
    expect(metaRow).toContainElement(screen.getByText("Сборная группа"));
  });

  it("normalizes request start time to HH:MM on the card", () => {
    render(
      <TripCard
        phase="waiting_offers"
        trip={{
          ...baseTrip,
          id: "request-time",
          startTime: "09:30:00",
        }}
      />,
    );

    expect(screen.getByText("09:30")).toBeInTheDocument();
    expect(screen.queryByText("09:30:00")).not.toBeInTheDocument();
  });

  it("renders no flex pills when both flags are false", () => {
    render(
      <TripCard
        phase="waiting_offers"
        trip={{
          id: "r2",
          destination: "Казань",
          startsOn: "2026-07-01",
          isOwnRequest: true,
          guideName: null,
          guideAvatarUrl: null,
          organizerName: null,
          openToJoin: false,
          datesFlexible: false,
        }}
      />,
    );
    expect(screen.queryByText("+ к группе")).not.toBeInTheDocument();
    expect(screen.queryByText("± даты")).not.toBeInTheDocument();
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

  it("links confirmed booking phases to the booking detail route", () => {
    render(<TripCard phase="upcoming" trip={{ ...baseTrip, id: "booking-42" }} />);

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/bookings/booking-42",
    );
  });

  it("links request phases to the request detail route", () => {
    render(
      <TripCard
        phase="awaiting_decision"
        trip={{ ...baseTrip, id: "request-7", offerCount: 2 }}
      />,
    );

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/requests/request-7",
    );
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

  it("shows «Ваш отзыв» with rating for completed with review", () => {
    render(
      <TripCard
        phase="completed"
        trip={{ ...baseTrip, hasReview: true, reviewRating: 5 }}
      />,
    );
    expect(screen.getByText("Ваш отзыв · 5")).toBeInTheDocument();
  });

  it("renders destination, guide name, and price for an upcoming booking WITHOUT routeStops", () => {
    render(
      <TripCard
        phase="upcoming"
        trip={{
          ...baseTrip,
          destination: "Казань",
          guideName: "QA Guide",
          price: { amount: 1_000_000, currency: "RUB" }, // 10 000 ₽ in minor units
          // NOTE: no routeStops — the exact shape getConfirmedBookings returns.
        }}
      />,
    );
    expect(screen.getByRole("heading", { name: "Казань" })).toBeInTheDocument();
    expect(screen.getByText("QA Guide")).toBeInTheDocument();
    expect(screen.getByText(/10\s?000\s?₽/)).toBeInTheDocument();
    expect(screen.getByText(/Написать гиду/)).toBeInTheDocument();
  });

  it("never renders a lone em-dash title for a booking with a destination", () => {
    render(
      <TripCard
        phase="upcoming"
        trip={{ ...baseTrip, destination: "Казань", guideName: "QA Guide" }}
      />,
    );
    expect(
      screen.queryByRole("heading", { name: "—" }),
    ).not.toBeInTheDocument();
  });
});
