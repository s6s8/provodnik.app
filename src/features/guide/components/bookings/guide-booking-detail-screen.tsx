"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  MapPin,
  ShieldAlert,
  Users,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  getGuideBookingById,
  updateGuideBookingStatus,
} from "@/data/guide-booking/local-store";
import type { GuideBookingRecord, GuideBookingStatus } from "@/data/guide-booking/types";
import { GuideBookingStatusBadge } from "@/features/guide/components/bookings/guide-booking-status";
import { cn } from "@/lib/utils";

type GuideBookingAction = "confirm" | "complete" | "cancel" | "no_show";

export function GuideBookingDetailScreen({ bookingId }: { bookingId: string }) {
  const [record, setRecord] = React.useState<GuideBookingRecord | null>(null);
  const [actionResult, setActionResult] = React.useState<{
    action: GuideBookingAction;
    nextStatus: GuideBookingStatus;
  } | null>(null);

  React.useEffect(() => {
    setRecord(getGuideBookingById(bookingId));
  }, [bookingId]);

  const performAction = React.useCallback(
    (action: GuideBookingAction) => {
      if (!record) return;
      const nextStatus = nextStatusForAction(record.status, action);
      if (!nextStatus) return;

      const next = updateGuideBookingStatus(record.id, nextStatus);
      if (!next) return;
      setRecord(next);
      setActionResult({ action, nextStatus });
    },
    [record],
  );

  if (!record) {
    return (
      <div className="space-y-6">
        <Badge variant="outline">Кабинет гида</Badge>
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-2">
            <CardTitle>Бронирование не найдено</CardTitle>
            <p className="text-sm text-muted-foreground">
              По этому идентификатору нет данных на этом устройстве.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="secondary">
              <Link href="/guide/bookings">
                <ArrowLeft className="size-4" />
                Назад к списку
              </Link>
            </Button>
            <Button asChild>
              <Link href="/guide/requests">Во входящие запросы</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dateLabel = `${record.request.startDate} to ${record.request.endDate}`;
  const total = totalAmountRub(record);
  const canConfirm = Boolean(nextStatusForAction(record.status, "confirm"));
  const canComplete = Boolean(nextStatusForAction(record.status, "complete"));
  const canCancel = Boolean(nextStatusForAction(record.status, "cancel"));
  const canNoShow = Boolean(nextStatusForAction(record.status, "no_show"));

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="ghost" className="-ml-3 px-3">
            <Link href="/guide/bookings">
              <ArrowLeft className="size-4" />
              Бронирования
            </Link>
          </Button>
          <GuideBookingStatusBadge status={record.status} />
        </div>

        <div className="space-y-2">
          <Badge variant="outline">Кабинет гида</Badge>
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
              Группа {record.request.groupSize} чел.
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="size-4 text-muted-foreground" />
              Модель выплат и залога — демо, без реальных списаний
            </span>
          </div>
        </div>
      </div>

      {actionResult ? (
        <div className="rounded-lg border border-border/70 bg-background/60 p-3 text-sm text-muted-foreground">
          Статус обновлён локально:{" "}
          <span className="font-medium text-foreground">{actionResult.action}</span>{" "}
          →{" "}
          <span className="font-medium text-foreground">
            {formatStatusLabelForSummary(actionResult.nextStatus)}
          </span>
        </div>
      ) : null}

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>Операции по бронированию</CardTitle>
          <p className="text-sm text-muted-foreground">
            Фиксируйте, как идёт тур: подтверждение, завершение, отмены и неявки
            отражаются только на этом устройстве.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <ActionButton
              label="Подтвердить"
              description="Закрепить тур и ожидать гостей."
              icon={<CheckCircle2 className="size-4" />}
              disabled={!canConfirm}
              onClick={() => performAction("confirm")}
            />
            <ActionButton
              label="Завершить"
              description="Отметить тур как проведённый."
              icon={<CheckCircle2 className="size-4" />}
              disabled={!canComplete}
              onClick={() => performAction("complete")}
            />
            <ActionButton
              label="Отменить"
              description="Зафиксировать отмену со стороны гида или гостя."
              icon={<XCircle className="size-4" />}
              disabled={!canCancel}
              onClick={() => performAction("cancel")}
            />
            <ActionButton
              label="Неявка"
              description="Гости не пришли к старту тура."
              icon={<ShieldAlert className="size-4" />}
              disabled={!canNoShow}
              onClick={() => performAction("no_show")}
            />
          </div>

          <Separator />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button className="w-full sm:w-auto" disabled>
              <CreditCard className="size-4" />
              Взять залог (демо)
            </Button>
            <Button className="w-full sm:w-auto" variant="secondary" disabled>
              Выплата гиду (демо)
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-1">
            <CardTitle>Состав группы</CardTitle>
            <p className="text-sm text-muted-foreground">
              Кто едет на этот тур (данные сгенерированы локально).
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {record.travelerRoster.length} участников
              </Badge>
              <Badge variant="outline">Основной контакт выделен</Badge>
            </div>
            <div className="grid gap-2">
              {record.travelerRoster.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-lg border border-border/70 bg-background/60 p-3",
                    item.isPrimaryContact && "border-primary/40 bg-background",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {item.displayName}
                    </p>
                    {item.isPrimaryContact ? (
                      <Badge variant="secondary">Основной контакт</Badge>
                    ) : (
                      <Badge variant="outline">Участник</Badge>
                    )}
                  </div>
                  {item.notes ? (
                    <p className="mt-2 text-sm text-muted-foreground">{item.notes}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-1">
            <CardTitle>Сводка маршрута</CardTitle>
            <p className="text-sm text-muted-foreground">
              Структура дня за днём, чтобы удобно вести тур по плану.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{record.itinerary.timezone}</Badge>
              <Badge variant="secondary">
                {record.itinerary.days.length} дней
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
                <p className="text-xs text-muted-foreground">Заметки</p>
                <p className="mt-1 text-sm text-foreground">{record.itinerary.notes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>Деньги и залог</CardTitle>
          <p className="text-sm text-muted-foreground">
            Суммы и залог показывают ориентировочную экономику тура. В этой версии нет
            реальных платежей — только модель.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Залог"
              value={formatRub(record.payment.depositRub)}
              helper={`Ориентировочно до ${formatDueDate(record.payment.depositDueAt)}`}
            />
            <StatCard
              label="Сумма по туру"
              value={formatRub(total)}
              helper="Сумма по позициям стоимости"
            />
            <StatCard
              label="Оценка выплаты гиду"
              value={formatRub(record.payment.payoutEstimateRub)}
              helper="После завершения тура (демо‑модель)"
            />
          </div>

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
        </CardContent>
      </Card>
    </div>
  );
}

function ActionButton({
  label,
  description,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group flex w-full flex-col items-start gap-2 rounded-xl border border-border/70 bg-background/60 p-4 text-left transition-colors",
        "hover:bg-background disabled:cursor-not-allowed disabled:opacity-60",
      )}
      aria-label={label}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="inline-flex size-7 items-center justify-center rounded-md border border-border/70 bg-background">
          {icon}
        </span>
        {label}
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </button>
  );
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

function totalAmountRub(record: GuideBookingRecord) {
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

function nextStatusForAction(
  current: GuideBookingStatus,
  action: GuideBookingAction,
): GuideBookingStatus | null {
  if (action === "confirm") {
    return current === "awaiting_confirmation" ? "confirmed" : null;
  }

  if (action === "complete") {
    if (current === "confirmed" || current === "in_progress") return "completed";
    return null;
  }

  if (action === "cancel") {
    if (current === "completed" || current === "cancelled" || current === "no_show") {
      return null;
    }
    return "cancelled";
  }

  if (action === "no_show") {
    if (current === "completed" || current === "cancelled") return null;
    return "no_show";
  }

  return null;
}

function formatStatusLabelForSummary(status: GuideBookingStatus) {
  switch (status) {
    case "awaiting_confirmation":
      return "Ожидает подтверждения";
    case "confirmed":
      return "Подтверждена";
    case "in_progress":
      return "В процессе";
    case "completed":
      return "Завершена";
    case "cancelled":
      return "Отменена";
    case "no_show":
      return "Неявка";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

