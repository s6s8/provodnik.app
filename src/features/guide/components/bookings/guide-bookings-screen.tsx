"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ListRow } from "@/components/shared/list-row";
import { StatTile } from "@/components/shared/stat-tile";
import { ListRowSkeleton } from "@/components/shared/loading-skeletons";
import { PageHeader } from "@/components/shared/page-header";
import { getGuideBookings, type BookingRecord } from "@/data/supabase/queries";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { GuideBookingStatusBadge } from "./guide-booking-status";
import type { GuideBookingStatus } from "@/data/guide-booking/types";

export function GuideBookingsScreen() {
  const [bookings, setBookings] = React.useState<BookingRecord[]>([]);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

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
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => { ignore = true; };
  }, [loadBookings]);

  const handleRetry = React.useCallback(async () => {
    setLoading(true);
    try {
      await loadBookings();
    } catch {
      setLoadError("Не удалось загрузить бронирования.");
    } finally {
      setLoading(false);
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

  const sortedBookings = React.useMemo(() => {
    return [...bookings].sort(
      (a, b) => statusPriority(a.status) - statusPriority(b.status),
    );
  }, [bookings]);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Кабинет гида" title="Мои бронирования" />

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3" aria-busy="true">
            <ListRowSkeleton />
            <ListRowSkeleton />
            <ListRowSkeleton />
          </div>
        ) : loadError ? (
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
          <EmptyState
            icon={<ArrowRight />}
            title="Пока нет бронирований"
            description="Бронирование появится после того, как путешественник примет ваше предложение."
            action={
              <Button asChild variant="secondary">
                <Link href="/guide/inbox">Перейти во входящие запросы</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3">
            {sortedBookings.map((record) => (
              <ListRow
                key={record.id}
                href={`/guide/bookings/${record.id}`}
                title={record.destination}
                subtitle={record.dateLabel}
                badge={
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{formatRub(record.priceRub)}</Badge>
                    <GuideBookingStatusBadge status={record.status as GuideBookingStatus} />
                  </div>
                }
              />
            ))}
          </div>
        )}
      </div>

      {!loading && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Итоги
          </p>
          <Card className="border-border/70 bg-card/90">
            <CardHeader className="space-y-1">
              <CardTitle>Итоги по бронированиям</CardTitle>
              <p className="text-sm text-muted-foreground">
                Быстрый взгляд на загрузку, выполненные экскурсии и ориентировочный оборот.
              </p>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-4">
              <StatTile label="Все бронирования" value={summary.totalCount} />
              <StatTile label="Активные сейчас" value={summary.activeCount} />
              <StatTile label="Завершено" value={summary.completedCount} />
              <StatTile label="Отменено" value={summary.cancelledCount} />
              <StatTile
                label="Сумма по экскурсиям"
                value={
                  summary.totalEarningsRub > 0 ? formatRub(summary.totalEarningsRub) : "—"
                }
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function statusPriority(status: BookingRecord["status"]) {
  if (
    status === "awaiting_confirmation" ||
    status === "confirmed" ||
    status === "in_progress"
  ) {
    return 0;
  }
  if (status === "completed") {
    return 1;
  }
  return 2;
}

function formatRub(amount: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    currencyDisplay: "symbol",
    maximumFractionDigits: 0,
  }).format(amount);
}
