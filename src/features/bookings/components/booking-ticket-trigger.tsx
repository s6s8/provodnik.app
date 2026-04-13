"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { BookingTicket } from "./booking-ticket";

interface BookingTicketTriggerProps {
  bookingId: string;
  listingTitle: string;
  guideName: string;
  guidePhone?: string | null;
  dateRange: string;
  participantCount?: number;
  meetingPoint?: string | null;
  orgDetails?: string | null;
}

export function BookingTicketTrigger(props: BookingTicketTriggerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Открыть билет
      </Button>

      {open ? (
        <BookingTicket
          {...props}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
