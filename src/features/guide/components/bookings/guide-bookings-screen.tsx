"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { listGuideBookings } from "@/data/guide-booking/local-store";
import type { GuideBookingRecord } from "@/data/guide-booking/types";
import { GuideBookingStatusBadge } from "@/features/guide/components/bookings/guide-booking-status";

export function GuideBookingsScreen() {
  const [bookings, setBookings] = React.useState<GuideBookingRecord[]>([]);

  React.useEffect(() => {
    setBookings(listGuideBookings());
  }, []);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge variant="outline">Guide workspace</Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Bookings workspace
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            Manage active trips, traveler rosters, and booking outcomes. This
            surface is powered by seeded local data in the MVP baseline.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="secondary">
            <Link href="/guide/requests">Requests inbox</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/guide/listings">Manage listings</Link>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {bookings.length === 0 ? (
          <Card className="border-border/70 bg-card/90">
            <CardHeader className="space-y-1">
              <CardTitle>No bookings yet</CardTitle>
              <p className="text-sm text-muted-foreground">
                Bookings appear after a traveler accepts an offer.
              </p>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary">
                <Link href="/guide/requests">
                  Open requests
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

function BookingCard({ record }: { record: GuideBookingRecord }) {
  const dateLabel = `${record.request.startDate} to ${record.request.endDate}`;

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
          <GuideBookingStatusBadge status={record.status} />
        </div>

        <Separator />

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{formatRub(totalAmountRub(record))}</Badge>
          <Badge variant="outline">
            {record.travelerRoster.length} in roster
          </Badge>
          <Badge variant="outline">Deposit {formatRub(record.payment.depositRub)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Updated {formatShortDate(record.updatedAt)}
        </p>
        <Button asChild variant="secondary">
          <Link href={`/guide/bookings/${record.id}`}>
            Open
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function totalAmountRub(record: GuideBookingRecord) {
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

