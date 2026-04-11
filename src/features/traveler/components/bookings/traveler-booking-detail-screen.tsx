"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  MapPin,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getUserBookings, type BookingRecord } from "@/data/supabase/queries";

export function TravelerBookingDetailScreen({
  bookingId,
}: {
  bookingId: string;
}) {
  const [record, setRecord] = React.useState<BookingRecord | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const result = await getUserBookings(supabase, user.id);
        if (cancelled) return;
        const found = result.data?.find((b) => b.id === bookingId) ?? null;
        setRecord(found);
      } catch {
        if (!cancelled) setRecord(null);
      }
    })();
    return () => { cancelled = true; };
  }, [bookingId]);

  if (!record) {
    return (
      <div className="space-y-6">
        <Badge variant="outline">Кабинет путешественника</Badge>
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-2">
            <CardTitle>Бронирование не найдено</CardTitle>
            <p className="text-sm text-muted-foreground">
              По этому идентификатору поездка на этом устройстве не найдена.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="secondary">
              <Link href="/traveler/bookings">
                <ArrowLeft className="size-4" />
                К списку поездок
              </Link>
            </Button>
            <Button asChild>
              <Link href="/traveler/requests">Все запросы</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canLeaveReview = record.status === "completed";

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="ghost" className="-ml-3 px-3">
            <Link href="/traveler/bookings">
              <ArrowLeft className="size-4" />
              Мои поездки
            </Link>
          </Button>
          <Badge variant="outline">{record.status}</Badge>
        </div>

        <div className="space-y-2">
          <Badge variant="outline">Кабинет путешественника</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {record.destination}
          </h1>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              {record.dateLabel}
            </span>
            {record.guideName ? (
              <span className="inline-flex items-center gap-2">
                <MapPin className="size-4 text-muted-foreground" />
                {record.guideName}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-4 text-muted-foreground" aria-hidden="true" />
            Оплата
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Оплата организуется менеджером Provodnik. После подтверждения
            бронирования с вами свяжутся, чтобы согласовать способ оплаты и
            внести предоплату.
          </p>
          <p>
            Сумма тура: {formatRub(record.priceRub)}.
          </p>
        </CardContent>
      </Card>

      {canLeaveReview ? (
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-1">
            <CardTitle>Поделитесь впечатлениями</CardTitle>
            <p className="text-sm text-muted-foreground">
              Оставьте короткий отзыв, пока детали свежи в памяти.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button asChild className="w-full sm:w-auto">
              <Link href={`/traveler/bookings/${record.id}/review`}>
                Оставить отзыв
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
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

