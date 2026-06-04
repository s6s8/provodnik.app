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
  });
});
