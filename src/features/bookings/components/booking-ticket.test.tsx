import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BookingTicket } from "./booking-ticket";

describe("BookingTicket", () => {
  it("renders participant count when it is zero", () => {
    render(
      <BookingTicket
        bookingId="booking-1"
        listingTitle="Экскурсия"
        guideName="Мария"
        dateRange="10 июня"
        participantCount={0}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Участников")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.queryByText("Длительность")).not.toBeInTheDocument();
  });

  it("renders confirmed trip facts", () => {
    render(
      <BookingTicket
        bookingId="booking-1"
        listingTitle="Экскурсия"
        guideName="Мария"
        dateRange="10 июня"
        meetingTime="13:00"
        duration="2 ч"
        participantCount={2}
        meetingPoint="Площадь Ленина"
        totalMinor={600000}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Время встречи")).toBeInTheDocument();
    expect(screen.getByText("13:00")).toBeInTheDocument();
    expect(screen.getByText("Длительность")).toBeInTheDocument();
    expect(screen.getByText("2 ч")).toBeInTheDocument();
    expect(screen.getByText("Площадь Ленина")).toBeInTheDocument();
    expect(screen.getByText("Итого")).toBeInTheDocument();
    expect(screen.getByText(/6\s000 ₽/)).toBeInTheDocument();
  });
});
