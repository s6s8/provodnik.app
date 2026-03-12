"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { listTravelerBookings } from "@/data/traveler-booking/local-store";
import type { TravelerBookingRecord } from "@/data/traveler-booking/types";
import { TravelerBookingStatusBadge } from "@/features/traveler/components/bookings/traveler-booking-status";

export function TravelerBookingsScreen() {
  const [bookings, setBookings] = React.useState<TravelerBookingRecord[]>([]);

  React.useEffect(() => {
    setBookings(listTravelerBookings());
  }, []);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge variant="outline">Traveler workspace</Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Bookings
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            Booking details and payment milestones. This surface is powered by
            seeded local data in the MVP baseline.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {bookings.length === 0 ? (
          <Card className="border-border/70 bg-card/90">
            <CardHeader className="space-y-1">
              <CardTitle>No bookings yet</CardTitle>
              <p className="text-sm text-muted-foreground">
                Once you accept an offer, it becomes a booking.
              </p>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary">
                <Link href="/traveler/requests">
                  Browse requests
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {bookings.map((item) => (
              <BookingCard key={item.id} record={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BookingCard({ record }: { record: TravelerBookingRecord }) {
  const dateLabel = `${record.request.startDate} to ${record.request.endDate}`;
  const amountLabel = formatRub(totalAmountRub(record));

  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">{record.request.destination}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {dateLabel} · {record.request.groupSize} traveler
              {record.request.groupSize === 1 ? "" : "s"}
            </p>
          </div>
          <TravelerBookingStatusBadge status={record.status} />
        </div>

        <Separator />

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{amountLabel}</Badge>
          <Badge variant="outline">{record.guide.displayName}</Badge>
          <Badge variant="outline">{record.guide.homeBase}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Updated {formatShortDate(record.updatedAt)}
        </p>
        <Button asChild variant="secondary">
          <Link href={`/traveler/bookings/${record.id}`}>
            Open
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function totalAmountRub(record: TravelerBookingRecord) {
  return record.payment.lineItems.reduce((sum, item) => sum + item.amountRub, 0);
}

function formatShortDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

function formatRub(amount: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}

