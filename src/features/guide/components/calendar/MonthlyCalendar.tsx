"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import type {
  ListingScheduleExtraRow,
  ListingScheduleRow,
  ListingTourDepartureRow,
} from "@/lib/supabase/types";
import { DayPanel } from "./day-panel";

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
  const [monthOffset, setMonthOffset] = React.useState(0);
  const [selectedListingId, setSelectedListingId] = React.useState<string>("all");
  const [localExtras, setLocalExtras] = React.useState<ListingScheduleExtraRow[]>(extras);
  const [dayPanelDate, setDayPanelDate] = React.useState<string | null>(null);

  const titleByListingId = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const l of listings) m.set(l.id, l.title);
    return m;
  }, [listings]);

  const listingDotClass = React.useMemo(() => {
    const m = new Map<string, string>();
    listings.forEach((l, i) => {
      m.set(l.id, i % 2 === 0 ? "bg-primary" : "bg-primary/50");
    });
    return m;
  }, [listings]);

  const dayPanelListing = React.useMemo(() => {
    if (listings.length === 1) return listings[0] ?? null;
    if (selectedListingId === "all") return null;
    return listings.find((l) => l.id === selectedListingId) ?? null;
  }, [listings, selectedListingId]);

  const visibleMonth = React.useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [monthOffset]);

  const monthTitle = React.useMemo(
    () =>
      visibleMonth.toLocaleDateString("ru-RU", {
        month: "long",
        year: "numeric",
      }),
    [visibleMonth],
  );

  const gridCells = React.useMemo(() => {
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


  return (
    <div className="space-y-4">
      {listings.length > 1 && (
        <select aria-label="Выберите предложение"
          value={selectedListingId}
          onChange={(e) => setSelectedListingId(e.target.value)}
          className="rounded-lg border border-border bg-surface-high px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="all">Все предложения</option>
          {listings.map((l) => (
            <option key={l.id} value={l.id}>{l.title}</option>
          ))}
        </select>
      )}

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
          for (const e of localExtras) {
            if (e.date === iso) listingIdsWithSlot.add(e.listing_id);
          }

          const hasDeparture = departures.some((d) => d.start_date === iso);

          return (
            <button
              key={iso}
              type="button"
              onClick={() => {
                if (dayPanelListing) setDayPanelDate(formatDateOnlyLocal(cell.date!));
              }}
              disabled={!dayPanelListing}
              className="flex min-h-[4.5rem] flex-col items-center gap-1 rounded-lg border border-border/60 bg-background/60 p-1.5 text-left transition hover:border-border hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {cell.date.getDate()}
              </span>
              <div className="flex min-h-[14px] flex-wrap items-center justify-center gap-0.5">
                {[...listingIdsWithSlot].map((id) => (
                  <span
                    key={id}
                    className={`size-1.5 shrink-0 rounded-full ${listingDotClass.get(id) ?? "bg-primary"}`}
                    title={titleByListingId.get(id) ?? ""}
                  />
                ))}
                {hasDeparture ? (
                  <span
                    className="size-1.5 shrink-0 rounded-sm bg-gold ring-1 ring-gold/40"
                    title="Отправление"
                  />
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 shrink-0 rounded-full bg-primary" />
          Слот
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 shrink-0 rounded-sm bg-gold ring-1 ring-gold/40" />
          Отправление
        </span>
      </div>

      {dayPanelDate && dayPanelListing && (
        <DayPanel
          date={dayPanelDate}
          dateLabel={new Date(dayPanelDate + "T00:00:00").toLocaleDateString("ru-RU", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
          listingId={dayPanelListing.id}
          listingTitle={dayPanelListing.title}
          extras={localExtras}
          onClose={() => setDayPanelDate(null)}
          onExtrasChange={(_date, newExtras) => {
            setLocalExtras(newExtras);
          }}
        />
      )}
    </div>
  );
}
