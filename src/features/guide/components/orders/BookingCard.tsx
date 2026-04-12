"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  confirmBooking,
  declineBooking,
} from "@/app/(protected)/guide/bookings/[bookingId]/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GuideBookingStatus } from "@/data/guide-booking/types";
import { GuideBookingStatusBadge } from "@/features/guide/components/bookings/guide-booking-status";
import type { BookingRow } from "@/lib/supabase/types";

function mapDbStatusToGuideStatus(status: string): GuideBookingStatus {
  switch (status) {
    case "pending":
    case "awaiting_guide_confirmation":
    case "awaiting_confirmation":
      return "awaiting_confirmation";
    case "confirmed":
      return "confirmed";
    case "in_progress":
      return "in_progress";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    case "no_show":
      return "no_show";
    default:
      return "awaiting_confirmation";
  }
}

function formatBookingWhen(startsAt: string | null): string {
  if (!startsAt) return "Дата уточняется";
  const d = new Date(startsAt);
  if (Number.isNaN(d.getTime())) return startsAt;
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSubtotal(minor: number, currency: string): string {
  const major = minor / 100;
  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(major);
  } catch {
    return `${major.toFixed(0)} ${currency}`;
  }
}

function BookingStatusBadge({ status }: { status: BookingRow["status"] }) {
  if (status === "disputed") {
    return <Badge variant="destructive">Спор</Badge>;
  }
  return (
    <GuideBookingStatusBadge status={mapDbStatusToGuideStatus(status)} />
  );
}

export function BookingCard({
  booking,
  onConfirm,
}: {
  booking: BookingRow;
  onConfirm?: (id: string) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const detailHref = `/guide/bookings/${booking.id}`;
  const showGuideActions = booking.status === "awaiting_guide_confirmation";

  const runConfirm = React.useCallback(() => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await confirmBooking(booking.id);
      if (result.ok) {
        onConfirm?.(booking.id);
        router.refresh();
      } else {
        setErrorMessage(result.error);
      }
    });
  }, [booking.id, onConfirm, router]);

  const runDecline = React.useCallback(() => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await declineBooking(booking.id);
      if (result.ok) {
        router.refresh();
      } else {
        setErrorMessage(result.error);
      }
    });
  }, [booking.id, router]);

  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <Link
              href={detailHref}
              className="text-base font-semibold text-foreground underline-offset-4 hover:underline"
            >
              {formatBookingWhen(booking.starts_at)}
            </Link>
            <p className="text-sm text-muted-foreground">
              Гостей: {booking.party_size} · {formatSubtotal(booking.subtotal_minor, booking.currency)}
            </p>
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {errorMessage ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : null}
        {showGuideActions ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={runConfirm}
            >
              Подтвердить
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isPending}
              onClick={runDecline}
            >
              Отклонить
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function GuideOrdersBookingTabs({
  novye,
  aktivnye,
  zavershennye,
  arhiv,
}: {
  novye: BookingRow[];
  aktivnye: BookingRow[];
  zavershennye: BookingRow[];
  arhiv: BookingRow[];
}) {
  const counts = {
    novye: novye.length,
    aktivnye: aktivnye.length,
    zavershennye: zavershennye.length,
    arhiv: arhiv.length,
  };

  return (
    <Tabs defaultValue="novye" className="w-full">
      <TabsList className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
        <TabsTrigger value="novye" className="gap-2">
          Новые
          <Badge variant="secondary" className="min-w-6 rounded-full px-1.5">
            {counts.novye}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="aktivnye" className="gap-2">
          Активные
          <Badge variant="secondary" className="min-w-6 rounded-full px-1.5">
            {counts.aktivnye}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="zavershennye" className="gap-2">
          Завершённые
          <Badge variant="secondary" className="min-w-6 rounded-full px-1.5">
            {counts.zavershennye}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="arhiv" className="gap-2">
          Архив
          <Badge variant="secondary" className="min-w-6 rounded-full px-1.5">
            {counts.arhiv}
          </Badge>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="novye" className="space-y-3">
        {novye.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет новых бронирований.</p>
        ) : (
          novye.map((b) => <BookingCard key={b.id} booking={b} />)
        )}
      </TabsContent>
      <TabsContent value="aktivnye" className="space-y-3">
        {aktivnye.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет активных бронирований.</p>
        ) : (
          aktivnye.map((b) => <BookingCard key={b.id} booking={b} />)
        )}
      </TabsContent>
      <TabsContent value="zavershennye" className="space-y-3">
        {zavershennye.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет завершённых бронирований.</p>
        ) : (
          zavershennye.map((b) => <BookingCard key={b.id} booking={b} />)
        )}
      </TabsContent>
      <TabsContent value="arhiv" className="space-y-3">
        {arhiv.length === 0 ? (
          <p className="text-sm text-muted-foreground">Архив пуст.</p>
        ) : (
          arhiv.map((b) => <BookingCard key={b.id} booking={b} />)
        )}
      </TabsContent>
    </Tabs>
  );
}
