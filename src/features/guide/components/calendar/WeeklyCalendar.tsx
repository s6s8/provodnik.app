"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type {
  ListingScheduleExtraRow,
  ListingScheduleRow,
  ListingTourDepartureRow,
} from "@/lib/supabase/types";

const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;

function formatDateOnlyLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeekMonday(base: Date): Date {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const js = d.getDay();
  const diff = js === 0 ? -6 : 1 - js;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
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

export type WeeklyCalendarProps = {
  schedules: ListingScheduleRow[];
  extras: ListingScheduleExtraRow[];
  departures: ListingTourDepartureRow[];
  listings: { id: string; title: string }[];
};

export function WeeklyCalendar({
  schedules,
  extras,
  departures,
  listings,
}: WeeklyCalendarProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const titleByListingId = useMemo(() => {
    const m = new Map<string, string>();
    for (const l of listings) m.set(l.id, l.title);
    return m;
  }, [listings]);

  const anchor = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const monday = useMemo(() => startOfWeekMonday(anchor), [anchor]);

  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const cell = new Date(monday);
      cell.setDate(monday.getDate() + i);
      days.push(cell);
    }
    return days;
  }, [monday]);

  const rangeLabel = useMemo(() => {
    const start = weekDays[0]!;
    const end = weekDays[6]!;
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };
    if (start.getFullYear() === end.getFullYear()) {
      if (start.getMonth() === end.getMonth()) {
        return `${start.getDate()}–${end.toLocaleDateString("ru-RU", { ...opts, year: "numeric" })}`;
      }
      return `${start.toLocaleDateString("ru-RU", opts)} – ${end.toLocaleDateString("ru-RU", { ...opts, year: "numeric" })}`;
    }
    return `${start.toLocaleDateString("ru-RU", { ...opts, year: "numeric" })} – ${end.toLocaleDateString("ru-RU", { ...opts, year: "numeric" })}`;
  }, [weekDays]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-foreground">{rangeLabel}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset((o) => o - 1)}
          >
            ← Предыдущая неделя
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset((o) => o + 1)}
          >
            Следующая неделя →
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
        {weekDays.map((day, idx) => {
          const iso = formatDateOnlyLocal(day);
          const dbWeekday = jsDayToDbWeekday(day);

          const weeklySlots = schedules.filter(
            (s) => s.weekday === dbWeekday,
          );
          const dayExtras = extras.filter((e) => e.date === iso);
          const dayDepartures = departures.filter((d) => d.start_date === iso);

          return (
            <div
              key={iso}
              className="rounded-[1rem] border border-border/70 bg-background/60 p-3 min-h-[120px]"
            >
              <div className="mb-2 border-b border-border/50 pb-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {WEEKDAY_LABELS[idx]}
                </p>
                <p className="text-lg font-semibold tabular-nums">{day.getDate()}</p>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {weeklySlots.map((s) => (
                  <li key={s.id} className="text-foreground">
                    <span className="font-medium">
                      {titleByListingId.get(s.listing_id) ?? "Тур"}
                    </span>
                    <span className="block text-muted-foreground">
                      Еженедельно · {formatTime(s.time_start)}–{formatTime(s.time_end)}
                    </span>
                  </li>
                ))}
                {dayExtras.map((e) => (
                  <li key={e.id} className="text-foreground">
                    <span className="font-medium">
                      {titleByListingId.get(e.listing_id) ?? "Тур"}
                    </span>
                    <span className="block text-muted-foreground">
                      Особая дата ·{" "}
                      {e.time_start && e.time_end
                        ? `${formatTime(e.time_start)}–${formatTime(e.time_end)}`
                        : "время не задано"}
                    </span>
                  </li>
                ))}
                {dayDepartures.map((dep) => {
                  const cur = dep.currency === "RUB" ? "₽" : dep.currency;
                  return (
                    <li key={dep.id} className="text-foreground">
                      <span className="font-medium">
                        {titleByListingId.get(dep.listing_id) ?? "Тур"}
                      </span>
                      <span className="block text-violet-600 dark:text-violet-400">
                        Отправление · от {formatRub(dep.price_minor)} {cur} ·{" "}
                        {departureStatusLabel(dep.status)}
                      </span>
                    </li>
                  );
                })}
                {weeklySlots.length === 0 &&
                dayExtras.length === 0 &&
                dayDepartures.length === 0 ? (
                  <li className="text-muted-foreground/80">Нет событий</li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
