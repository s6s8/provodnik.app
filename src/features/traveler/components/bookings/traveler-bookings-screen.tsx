"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getUserBookings, type BookingRecord } from "@/data/supabase/queries";


export function TravelerBookingsScreen() {
  const [bookings, setBookings] = React.useState<BookingRecord[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const result = await getUserBookings(supabase, user.id);
        if (!cancelled && result.data) setBookings(result.data);
      } catch {
        if (!cancelled) setBookings([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge variant="outline">Кабинет путешественника</Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Мои поездки
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            Здесь собраны все ваши подтверждённые поездки: статусы, оплата и
            детали маршрута. Пока данные живут только локально на этом
            устройстве.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {bookings.length === 0 ? (
          <Card className="border-border/70 bg-card/90">
            <CardHeader className="space-y-1">
              <CardTitle>Пока нет бронирований</CardTitle>
              <p className="text-sm text-muted-foreground">
                Как только вы согласуете предложение гида, оно появится здесь
                как оформленная поездка.
              </p>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary">
                <Link href="/traveler/requests">
                  Перейти к запросам
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
  const canLeaveReview = record.status === "completed";

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
          <Badge variant="outline">{record.status}</Badge>
        </div>

        <Separator />

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{formatRub(record.priceRub)}</Badge>
          {record.guideName ? (
            <Badge variant="outline">{record.guideName}</Badge>
          ) : null}
          {canLeaveReview ? (
            <Badge variant="outline">Можно оставить отзыв</Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {canLeaveReview ? (
            <Button asChild>
              <Link href={`/traveler/bookings/${record.id}/review`}>
                Оставить отзыв
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="secondary">
            <Link href={`/traveler/bookings/${record.id}`}>
              Открыть
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
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

