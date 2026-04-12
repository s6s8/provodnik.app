"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  ListingScheduleExtraRow,
  ListingScheduleRow,
  ListingTourDepartureRow,
} from "@/lib/supabase/types";

const LISTING_DOT_CLASSES = [
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-cyan-500",
] as const;

function formatDateOnlyLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function jsDayToDbWeekday(date: Date): number {
  const js = date.getDay();
  return js === 0 ? 6 : js - 1;
}

function formatTime(t: string | null): string {
  if (!t) return "—";
  const parts = t.split(":");
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return t;
}

function formatRub(minor: number): string {
  return new Intl.NumberFormat("ru-RU").format(Math.round(minor / 100));
}

function departureStatusLabel(status: string): string {
  if (status === "active") return "Активно";
  if (status === "sold_out") return "Мест нет";
  if (status === "cancelled") return "Отменено";
  return status;
}

export type MonthlyCalendarProps = {
  schedules: ListingScheduleRow[];
  extras: ListingScheduleExtraRow[];
  departures: ListingTourDepartureRow[];
  listings: { id: string; title: string }[];
};

export function MonthlyCalendar({
  schedules,
  extras,
  departures,
  listings,
}: MonthlyCalendarProps) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [dialogDate, setDialogDate] = useState<Date | null>(null);

  const titleByListingId = useMemo(() => {
    const m = new Map<string, string>();
    for (const l of listings) m.set(l.id, l.title);
    return m;
  }, [listings]);

  const listingColorClass = useMemo(() => {
    const m = new Map<string, string>();
    listings.forEach((l, i) => {
      m.set(l.id, LISTING_DOT_CLASSES[i % LISTING_DOT_CLASSES.length]!);
    });
    return m;
  }, [listings]);

  const visibleMonth = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [monthOffset]);

  const monthTitle = useMemo(
    () =>
      visibleMonth.toLocaleDateString("ru-RU", {
        month: "long",
        year: "numeric",
      }),
    [visibleMonth],
  );

  const gridCells = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leading = (first.getDay() + 6) % 7;

    const cells: { date: Date | null }[] = [];
    for (let i = 0; i < leading; i++) {
      cells.push({ date: null });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ date: new Date(year, month, day) });
    }
    while (cells.length < 42) {
      cells.push({ date: null });
    }
    return cells.slice(0, 42);
  }, [visibleMonth]);

  const dialogIso = dialogDate ? formatDateOnlyLocal(dialogDate) : null;

  const dialogContent = useMemo(() => {
    if (!dialogDate || !dialogIso) return null;

    const dbWeekday = jsDayToDbWeekday(dialogDate);
    const weeklySlots = schedules.filter((s) => s.weekday === dbWeekday);
    const dayExtras = extras.filter((e) => e.date === dialogIso);
    const dayDepartures = departures.filter((d) => d.start_date === dialogIso);

    return { weeklySlots, dayExtras, dayDepartures };
  }, [dialogDate, dialogIso, schedules, extras, departures]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-foreground">{monthTitle}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMonthOffset((o) => o - 1)}
          >
            ← Предыдущий месяц
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMonthOffset((o) => o + 1)}
          >
            Следующий →
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {gridCells.map((cell, idx) => {
          if (!cell.date) {
            return (
              <div
                key={`empty-${idx}`}
                className="min-h-[4.5rem] rounded-lg border border-transparent bg-muted/20"
              />
            );
          }

          const iso = formatDateOnlyLocal(cell.date);
          const dbWeekday = jsDayToDbWeekday(cell.date);

          const listingIdsWithSlot = new Set<string>();
          for (const s of schedules) {
            if (s.weekday === dbWeekday) listingIdsWithSlot.add(s.listing_id);
          }
          for (const e of extras) {
            if (e.date === iso) listingIdsWithSlot.add(e.listing_id);
          }

          const hasDeparture = departures.some((d) => d.start_date === iso);

          return (
            <button
              key={iso}
              type="button"
              onClick={() => setDialogDate(cell.date)}
              className="flex min-h-[4.5rem] flex-col items-center gap-1 rounded-lg border border-border/60 bg-background/60 p-1.5 text-left transition hover:border-border hover:bg-muted/30"
            >
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {cell.date.getDate()}
              </span>
              <div className="flex min-h-[14px] flex-wrap items-center justify-center gap-0.5">
                {[...listingIdsWithSlot].map((id) => (
                  <span
                    key={id}
                    className={`size-1.5 shrink-0 rounded-full ${listingColorClass.get(id) ?? "bg-muted-foreground"}`}
                    title={titleByListingId.get(id) ?? ""}
                  />
                ))}
                {hasDeparture ? (
                  <span
                    className="size-1.5 shrink-0 rounded-sm bg-violet-500 ring-1 ring-violet-300 dark:ring-violet-700"
                    title="Отправление"
                  />
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={dialogDate !== null} onOpenChange={(o) => !o && setDialogDate(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogDate
                ? dialogDate.toLocaleDateString("ru-RU", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : ""}
            </DialogTitle>
          </DialogHeader>
          {dialogContent ? (
            <ul className="space-y-3 text-sm">
              {dialogContent.weeklySlots.map((s) => (
                <li key={s.id}>
                  <span className="font-medium text-foreground">
                    {titleByListingId.get(s.listing_id) ?? "Тур"}
                  </span>
                  <p className="text-muted-foreground">
                    Еженедельно · {formatTime(s.time_start)}–{formatTime(s.time_end)}
                  </p>
                </li>
              ))}
              {dialogContent.dayExtras.map((e) => (
                <li key={e.id}>
                  <span className="font-medium text-foreground">
                    {titleByListingId.get(e.listing_id) ?? "Тур"}
                  </span>
                  <p className="text-muted-foreground">
                    Особая дата ·{" "}
                    {e.time_start && e.time_end
                      ? `${formatTime(e.time_start)}–${formatTime(e.time_end)}`
                      : "время не задано"}
                  </p>
                </li>
              ))}
              {dialogContent.dayDepartures.map((dep) => {
                const cur = dep.currency === "RUB" ? "₽" : dep.currency;
                return (
                  <li key={dep.id}>
                    <span className="font-medium text-foreground">
                      {titleByListingId.get(dep.listing_id) ?? "Тур"}
                    </span>
                    <p className="text-violet-600 dark:text-violet-400">
                      Отправление · от {formatRub(dep.price_minor)} {cur} ·{" "}
                      {departureStatusLabel(dep.status)}
                    </p>
                  </li>
                );
              })}
              {dialogContent.weeklySlots.length === 0 &&
              dialogContent.dayExtras.length === 0 &&
              dialogContent.dayDepartures.length === 0 ? (
                <p className="text-muted-foreground">Нет слотов в этот день.</p>
              ) : null}
            </ul>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
