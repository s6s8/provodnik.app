"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Shield,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  getTravelerBookingById,
  listTimelineForTravelerBooking,
} from "@/data/traveler-booking/local-store";
import type {
  TravelerBookingRecord,
  TravelerBookingTimelineStep,
} from "@/data/traveler-booking/types";
import { TravelerBookingStatusBadge } from "@/features/traveler/components/bookings/traveler-booking-status";

export function TravelerBookingDetailScreen({
  bookingId,
}: {
  bookingId: string;
}) {
  const [record, setRecord] = React.useState<TravelerBookingRecord | null>(null);

  React.useEffect(() => {
    setRecord(getTravelerBookingById(bookingId));
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

  const timeline = listTimelineForTravelerBooking(record.id);
  const dateLabel = `${record.request.startDate} to ${record.request.endDate}`;
  const total = totalAmountRub(record);
  const remaining = Math.max(0, total - record.payment.depositRub);
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
          <TravelerBookingStatusBadge status={record.status} />
        </div>

        <div className="space-y-2">
          <Badge variant="outline">Кабинет путешественника</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {record.request.destination}
          </h1>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              {dateLabel}
            </span>
            <span className="inline-flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              {record.request.groupSize}{" "}
              {record.request.groupSize === 1 ? "путешественник" : "путешественника"}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="size-4 text-muted-foreground" />
              {record.guide.homeBase}
            </span>
          </div>
        </div>
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>Подтверждение поездки</CardTitle>
          <p className="text-sm text-muted-foreground">
            Забронируйте даты с помощью предоплаты. Оставшаяся сумма вносится
            ближе к началу путешествия.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border/70 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">Предоплата</p>
              <p className="mt-1 text-base font-semibold text-foreground">
                {formatRub(record.payment.depositRub)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Оплатить до {formatDueDate(record.payment.depositDueAt)}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">Остаток</p>
              <p className="mt-1 text-base font-semibold text-foreground">
                {formatRub(remaining)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Вносится после предоплаты (демо-режим)
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">Итого</p>
              <p className="mt-1 text-base font-semibold text-foreground">
                {formatRub(total)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Включая комиссии и ориентировочные расходы
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button className="w-full sm:w-auto" disabled>
              <CreditCard className="size-4" />
              Оплатить предоплату (демо)
            </Button>
            <Button asChild variant="secondary" className="w-full sm:w-auto">
              <Link href={`/traveler/requests/${record.request.id}`}>
                Открыть исходный запрос
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {canLeaveReview ? (
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-1">
            <CardTitle>Поделитесь впечатлениями</CardTitle>
            <p className="text-sm text-muted-foreground">
              Оставьте короткий отзыв, пока детали свежи в памяти. Сейчас отзывы
              сохраняются локально на этом устройстве.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button asChild className="w-full sm:w-auto">
              <Link href={`/traveler/bookings/${record.id}/review`}>
                Оставить отзыв
              </Link>
            </Button>
            {record.guide.slug ? (
              <Button asChild variant="secondary" className="w-full sm:w-auto">
                <Link href={`/guides/${record.guide.slug}`}>Профиль гида</Link>
              </Button>
            ) : null}
            {record.listingSlug ? (
              <Button asChild variant="secondary" className="w-full sm:w-auto">
                <Link href={`/listings/${record.listingSlug}`}>Программа тура</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3">
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-1">
            <CardTitle>Кто едет</CardTitle>
            <p className="text-sm text-muted-foreground">
              Информация о путешественнике и размере группы.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{record.traveler.displayName}</Badge>
              <Badge variant="outline">
                {record.request.groupSize}{" "}
                {record.request.groupSize === 1 ? "путешественник" : "путешественника"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-1">
            <CardTitle>Ваш гид</CardTitle>
            <p className="text-sm text-muted-foreground">
              Кто будет вести вашу поездку.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{record.guide.displayName}</Badge>
              <Badge variant="outline">
                Оценка {record.guide.rating.toFixed(1)} / 5
              </Badge>
              <Badge variant="outline">
                {record.guide.completedTrips} завершённых поездок
              </Badge>
              <Badge variant="outline">
                Отвечает примерно за {record.guide.responseTimeHours} ч
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>Программа по дням</CardTitle>
          <p className="text-sm text-muted-foreground">
            Краткий план поездки по дням и основным точкам.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{record.itinerary.timezone}</Badge>
            <Badge variant="secondary">
              {record.itinerary.days.length}{" "}
              {record.itinerary.days.length === 1 ? "день" : "дней"}
            </Badge>
          </div>

          <div className="space-y-3">
            {record.itinerary.days.map((day) => (
              <div
                key={day.day}
                className="rounded-lg border border-border/70 bg-background/60 p-3"
              >
                <p className="text-sm font-medium text-foreground">
                  День {day.day}: {day.title}
                </p>
                <ul className="mt-2 grid gap-1 text-sm text-muted-foreground">
                  {day.beats.map((beat) => (
                    <li key={beat} className="flex items-start gap-2">
                      <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/70" />
                      <span>{beat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {record.itinerary.notes ? (
            <div className="rounded-lg border border-border/70 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">Дополнительно</p>
              <p className="mt-1 text-sm text-foreground">{record.itinerary.notes}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>Состав стоимости</CardTitle>
          <p className="text-sm text-muted-foreground">
            Разбивка стоимости по позициям для наглядности (демо-данные).
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            {record.payment.lineItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/60 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.kind}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-foreground">
                  {formatRub(item.amountRub)}
                </p>
              </div>
            ))}
          </div>

          <Separator />

          <div className="grid gap-2">
            <Row label="Предоплата сейчас" value={formatRub(record.payment.depositRub)} />
            <Row label="Останется после предоплаты" value={formatRub(remaining)} />
            <Row label="Итого" value={formatRub(total)} strong />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>Отмена и изменения</CardTitle>
          <p className="text-sm text-muted-foreground">
            Кратко о том, что происходит при переносе или отмене поездки.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 rounded-lg border border-border/70 bg-background/60 p-3">
            <Shield className="mt-0.5 size-4 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {record.cancellationPolicy.summary}
              </p>
              <ul className="grid gap-1 text-sm text-muted-foreground">
                {record.cancellationPolicy.bullets.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/70" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>Ход поездки</CardTitle>
          <p className="text-sm text-muted-foreground">
            Основные этапы — от подтверждения бронирования до завершения поездки.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Для этой поездки события ещё не зафиксированы.
            </p>
          ) : (
            <div className="space-y-2">
              {timeline.map((step) => (
                <TimelineStepRow key={step.id} step={step} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TimelineStepRow({ step }: { step: TravelerBookingTimelineStep }) {
  const icon =
    step.state === "done" ? (
      <CheckCircle2 className="mt-0.5 size-4 text-foreground" />
    ) : step.state === "current" ? (
      <Clock className="mt-0.5 size-4 text-foreground" />
    ) : (
      <Clock className="mt-0.5 size-4 text-muted-foreground" />
    );

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-background/60 p-3">
      {icon}
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium text-foreground">{step.title}</p>
        {step.description ? (
          <p className="text-sm text-muted-foreground">{step.description}</p>
        ) : null}
      </div>
      <Badge variant={step.state === "current" ? "secondary" : "outline"}>
        {step.at ? formatTimelineDate(step.at) : "-"}
      </Badge>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={
          strong
            ? "text-sm font-semibold text-foreground"
            : "text-sm text-foreground"
        }
      >
        {value}
      </p>
    </div>
  );
}

function totalAmountRub(record: TravelerBookingRecord) {
  return record.payment.lineItems.reduce((sum, item) => sum + item.amountRub, 0);
}

function formatRub(amount: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDueDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimelineDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

