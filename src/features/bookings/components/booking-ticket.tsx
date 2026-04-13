"use client";

import * as React from "react";
import { X, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

interface BookingTicketProps {
  bookingId: string;
  listingTitle: string;
  guideName: string;
  guidePhone?: string | null;
  dateRange: string;
  participantCount?: number;
  meetingPoint?: string | null;
  orgDetails?: string | null;
  onClose: () => void;
}

export function BookingTicket({
  bookingId,
  listingTitle,
  guideName,
  guidePhone,
  dateRange,
  participantCount,
  meetingPoint,
  orgDetails,
  onClose,
}: BookingTicketProps) {
  const ticketRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Билет на поездку"
        className="fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 max-w-lg mx-auto"
      >
        <div
          ref={ticketRef}
          className="rounded-2xl bg-background border border-border shadow-xl overflow-hidden print:shadow-none print:border-none"
        >
          {/* Header stripe */}
          <div className="bg-foreground px-6 py-5 text-background">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-background/60 mb-1">
                  Provodnik · Ваша поездка
                </p>
                <h2 className="text-lg font-semibold leading-tight">{listingTitle}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-background/60 hover:bg-background/10 hover:text-background transition-colors print:hidden"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Ticket body */}
          <div className="px-6 py-5 space-y-4">
            {/* Booking ID */}
            <div className="rounded-lg bg-muted/50 px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Номер поездки</p>
              <p className="font-mono text-xl font-semibold tracking-widest text-foreground">
                {bookingId.slice(0, 8).toUpperCase()}
              </p>
            </div>

            {/* Details grid */}
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Гид</dt>
                <dd className="font-medium text-foreground text-right">{guideName}</dd>
              </div>

              {dateRange ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Дата</dt>
                  <dd className="font-medium text-foreground text-right">{dateRange}</dd>
                </div>
              ) : null}

              {participantCount ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Участников</dt>
                  <dd className="font-medium text-foreground">{participantCount}</dd>
                </div>
              ) : null}

              {guidePhone ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Телефон гида</dt>
                  <dd className="font-medium text-foreground">
                    <a href={`tel:${guidePhone}`} className="text-primary">
                      {guidePhone}
                    </a>
                  </dd>
                </div>
              ) : null}

              {meetingPoint ? (
                <div className="flex flex-col gap-1">
                  <dt className="text-muted-foreground">Место встречи</dt>
                  <dd className="font-medium text-foreground">{meetingPoint}</dd>
                </div>
              ) : null}

              {orgDetails ? (
                <div className="flex flex-col gap-1">
                  <dt className="text-muted-foreground">Организационные детали</dt>
                  <dd className="text-foreground text-xs leading-relaxed whitespace-pre-wrap">{orgDetails}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          {/* Footer */}
          <div className="border-t border-border px-6 py-4 flex items-center justify-between gap-3 print:hidden">
            <p className="text-xs text-muted-foreground">
              Покажите этот билет гиду при встрече
            </p>
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
              <Printer className="size-3.5" />
              Печать
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
