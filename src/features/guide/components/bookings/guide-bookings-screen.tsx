"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getGuideBookings, type BookingRecord } from "@/data/supabase/queries";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import type { BookingStatus } from "@/lib/bookings/state-machine";

export function GuideBookingsScreen() {
  const [bookings, setBookings] = React.useState<BookingRecord[]>([]);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const loadBookings = React.useCallback(async () => {
    setLoadError(null);

    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await getGuideBookings(supabase, user.id);
    if (error) {
      throw error;
    }
    setBookings(data ?? []);
  }, []);

  React.useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        await loadBookings();
      } catch {
        if (!ignore) {
          setLoadError("Не удалось загрузить бронирования.");
        }
      }
    }

    void load();
    return () => { ignore = true; };
  }, [loadBookings]);

  const handleRetry = React.useCallback(async () => {
    try {
      await loadBookings();
    } catch {
      setLoadError("Не удалось загрузить бронирования.");
    }
  }, [loadBookings]);

  const summary = React.useMemo(() => {
    const totalCount = bookings.length;
    let activeCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    let totalEarningsRub = 0;

    for (const booking of bookings) {
      totalEarningsRub += booking.priceRub;

      if (
        booking.status === "awaiting_confirmation" ||
        booking.status === "confirmed" ||
        booking.status === "in_progress"
      ) {
        activeCount += 1;
      } else if (booking.status === "completed") {
        completedCount += 1;
      } else if (booking.status === "cancelled" || booking.status === "no_show") {
        cancelledCount += 1;
      }
    }

    return {
      totalCount,
      activeCount,
      completedCount,
      cancelledCount,
      totalEarningsRub,
    };
  }, [bookings]);

  return (
    <div className="space-y-8">
      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>Итоги по бронированиям</CardTitle>
          <p className="text-sm text-muted-foreground">
            Быстрый взгляд на загрузку, выполненные экскурсии и ориентировочный оборот.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-border/70 bg-background/60 p-3">
            <p className="text-xs text-muted-foreground">Все бронирования</p>
            <p className="mt-1 text-base font-semibold text-foreground">
              {summary.totalCount}
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background/60 p-3">
            <p className="text-xs text-muted-foreground">Активные сейчас</p>
            <p className="mt-1 text-base font-semibold text-foreground">
              {summary.activeCount}
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background/60 p-3">
            <p className="text-xs text-muted-foreground">Завершено</p>
            <p className="mt-1 text-base font-semibold text-foreground">
              {summary.completedCount}
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background/60 p-3">
            <p className="text-xs text-muted-foreground">Сумма по экскурсиям</p>
            <p className="mt-1 text-base font-semibold text-foreground">
              {summary.totalEarningsRub > 0 ? formatRub(summary.totalEarningsRub) : "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loadError ? (
          <Card className="border-border/70 bg-card/90">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="size-5 text-destructive" />
                {loadError}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Проверьте соединение и повторите загрузку.
              </p>
            </CardHeader>
            <CardContent>
              <Button type="button" variant="secondary" onClick={handleRetry}>
                Повторить загрузку
              </Button>
            </CardContent>
          </Card>
        ) : bookings.length === 0 ? (
          <Card className="border-border/70 bg-card/90">
            <CardHeader className="space-y-1">
              <CardTitle>Пока нет бронирований</CardTitle>
              <p className="text-sm text-muted-foreground">
                Бронирование появится здесь после того, как путешественник примет ваше
                предложение.
              </p>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary">
                <Link href="/guide/inbox">
                  Перейти во входящие запросы
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

function BookingCard({ record }: { record: BookingRecord }) {
  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">{record.destination}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {record.dateLabel}
            </p>
          </div>
          <BookingStatusBadge status={record.status as BookingStatus} />
        </div>

        <Separator />

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{formatRub(record.priceRub)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {record.title}
        </p>
        <Button asChild variant="secondary">
          <Link href={`/guide/bookings/${record.id}`}>
            Открыть
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}


function formatRub(amount: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    currencyDisplay: "symbol",
    maximumFractionDigits: 0,
  }).format(amount);
}

