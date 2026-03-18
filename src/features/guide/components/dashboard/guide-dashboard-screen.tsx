"use client";

import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GuideOnboardingForm } from "@/features/guide/components/onboarding/guide-onboarding-form";
import { getSeededTravelerRequests } from "@/data/traveler-request/seed";
import { getSeededGuideListingRecords } from "@/data/guide-listing/seed";
import { listGuideBookings } from "@/data/guide-booking/local-store";
import type { GuideBookingRecord } from "@/data/guide-booking/types";
import type { AuthContext } from "@/lib/auth/types";

type GuideDashboardScreenProps = {
  auth: AuthContext;
};

function formatRub(amount: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}

function totalBookingAmountRub(record: GuideBookingRecord) {
  return record.payment.lineItems.reduce((sum, item) => sum + item.amountRub, 0);
}

export function GuideDashboardScreen({ auth }: GuideDashboardScreenProps) {
  const [bookings, setBookings] = React.useState<GuideBookingRecord[]>([]);

  React.useEffect(() => {
    setBookings(listGuideBookings());
  }, []);

  const requestSummary = React.useMemo(() => {
    const items = getSeededTravelerRequests();
    const total = items.length;
    const highBudget = items.filter(
      (item) => item.request.budgetPerPersonRub >= 15000
    ).length;

    return {
      total,
      highBudget,
      sample: items.slice(0, 3),
    };
  }, []);

  const listingSummary = React.useMemo(() => {
    const records = getSeededGuideListingRecords();
    const total = records.length;
    const active = records.filter(
      (record) => record.listing.status === "active"
    ).length;

    return {
      total,
      active,
      sample: records.slice(0, 3),
    };
  }, []);

  const bookingSummary = React.useMemo(() => {
    const totalCount = bookings.length;
    let activeCount = 0;
    let acceptedCount = 0;
    let totalEarningsRub = 0;

    for (const booking of bookings) {
      const amount = totalBookingAmountRub(booking);
      totalEarningsRub += amount;

      if (
        booking.status === "awaiting_confirmation" ||
        booking.status === "confirmed" ||
        booking.status === "in_progress"
      ) {
        activeCount += 1;
      }

      if (booking.status === "confirmed" || booking.status === "completed") {
        acceptedCount += 1;
      }
    }

    return {
      totalCount,
      activeCount,
      acceptedCount,
      totalEarningsRub,
      sample: bookings.slice(0, 3),
    };
  }, [bookings]);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge variant="outline">Кабинет гида</Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Панель гида
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            Здесь собираются основные операции гида: анкета для проверки, входящие
            запросы, ваши программы и бронирования. Анкета остаётся главным шагом
            запуска, всё остальное помогает готовиться к первым турам.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="secondary">
            <Link href="#onboarding">Заполнить анкету гида</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/guide/requests">Входящие запросы</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/guide/bookings">Бронирования</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/guide/listings">Мои программы</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-1">
            <CardTitle>Входящие запросы</CardTitle>
            <p className="text-sm text-muted-foreground">
              Короткий срез по очереди запросов и бюджету.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border/70 bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Всего запросов</p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {requestSummary.total}
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Бюджет от 15 000 ₽</p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {requestSummary.highBudget}
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Готовы к разбору</p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {requestSummary.total}
                </p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              {requestSummary.sample.map((item) => (
                <Link
                  key={item.id}
                  href={`/guide/requests/${item.id}`}
                  className="block rounded-lg border border-border/60 bg-background/60 p-3 text-sm transition-colors hover:bg-background"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-foreground">
                      {item.traveler.displayName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.request.startDate} – {item.request.endDate}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.request.destination} · группа {item.request.groupSize} · бюджет{" "}
                    {formatRub(item.request.budgetPerPersonRub)}
                  </p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-1">
            <CardTitle>Предложение и программы</CardTitle>
            <p className="text-sm text-muted-foreground">
              Обзор активных программ и готовности к показу.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/70 bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Всего программ</p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {listingSummary.total}
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Активны для гостей</p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {listingSummary.active}
                </p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              {listingSummary.sample.map((record) => (
                <div
                  key={record.id}
                  className="rounded-lg border border-border/60 bg-background/60 p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-foreground">
                      {record.listing.title}
                    </p>
                    <Badge variant="outline">{record.listing.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {record.listing.region} · {record.listing.durationHours} ч · до{" "}
                    {record.listing.capacity} гостей
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-1">
            <CardTitle>Бронирования</CardTitle>
            <p className="text-sm text-muted-foreground">
              Принятые и активные поездки с ориентировочным оборотом.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border/70 bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Все бронирования</p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {bookingSummary.totalCount}
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Активные сейчас</p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {bookingSummary.activeCount}
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Принятые гостями</p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {bookingSummary.acceptedCount}
                </p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              {bookingSummary.totalEarningsRub > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Оценка оборота по турам:{" "}
                  <span className="font-semibold text-foreground">
                    {formatRub(bookingSummary.totalEarningsRub)}
                  </span>
                </p>
              ) : null}
              {bookingSummary.sample.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/guide/bookings/${booking.id}`}
                  className="block rounded-lg border border-border/60 bg-background/60 p-3 text-sm transition-colors hover:bg-background"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-foreground">
                      {booking.request.destination}
                    </p>
                    <Badge variant="outline">{booking.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {booking.request.startDate} – {booking.request.endDate} · группа{" "}
                    {booking.request.groupSize} чел.
                  </p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <section id="onboarding" className="space-y-4">
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-2">
            <CardTitle>Анкета гида и проверка данных</CardTitle>
            <p className="text-sm text-muted-foreground">
              Это главный шаг запуска кабинета гида. Заполненная анкета станет основой
              для верификации и качества листингов. При отсутствии Supabase всё
              сохраняется локально в этом браузере.
            </p>
          </CardHeader>
          <CardContent>
            <GuideOnboardingForm auth={auth} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

