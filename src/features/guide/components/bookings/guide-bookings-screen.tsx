"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getGuideBookings, type BookingRecord } from "@/data/supabase/queries";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { GuideBookingStatusBadge } from "@/features/guide/components/bookings/guide-booking-status";

export function GuideBookingsScreen() {
  const [bookings, setBookings] = React.useState<BookingRecord[]>([]);

  React.useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || ignore) return;
        const { data } = await getGuideBookings(supabase, user.id);
        if (!ignore && data) setBookings(data);
      } catch {
        // leave empty
      }
    }

    void load();
    return () => { ignore = true; };
  }, []);

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
      <div className="space-y-3">
        <Badge variant="outline">Кабинет гида</Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Бронирования
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            Операционный экран по турам: подтверждайте поездки, следите за статусом групп
            и ориентировочным доходом. В этой версии данные хранятся локально на
            устройстве.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="secondary">
            <Link href="/guide/requests">Входящие запросы</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/guide/listings">Мои программы</Link>
          </Button>
        </div>
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>Итоги по бронированиям</CardTitle>
          <p className="text-sm text-muted-foreground">
            Быстрый взгляд на загрузку, выполненные туры и ориентировочный оборот.
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
            <p className="text-xs text-muted-foreground">Сумма по турам (RUB)</p>
            <p className="mt-1 text-base font-semibold text-foreground">
              {summary.totalEarningsRub > 0 ? formatRub(summary.totalEarningsRub) : "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {bookings.length === 0 ? (
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
                <Link href="/guide/requests">
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
          <GuideBookingStatusBadge status={record.status as import("@/data/guide-booking/types").GuideBookingStatus} />
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
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}

