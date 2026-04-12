"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { ListingDayRow } from "@/lib/supabase/types";

function formatDateOverride(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

export function TourItineraryDisplay({ days }: { days: ListingDayRow[] }) {
  const [openSet, setOpenSet] = useState<Set<number>>(new Set());
  const allOpen = openSet.size === days.length;

  if (days.length === 0) return null;

  function toggleAll() {
    if (allOpen) {
      setOpenSet(new Set());
    } else {
      setOpenSet(new Set(days.map((d) => d.day_number)));
    }
  }

  function toggleDay(n: number) {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Программа</h2>
        <Button variant="ghost" size="sm" onClick={toggleAll}>
          {allOpen ? "Свернуть всё" : "Развернуть всё"}
        </Button>
      </div>

      <ol className="space-y-2">
        {days.map((day) => {
          const isOpen = openSet.has(day.day_number);
          const dayLabel = day.date_override
            ? `День ${day.day_number} · ${formatDateOverride(day.date_override)}`
            : `День ${day.day_number}`;
          const heading = day.title ? `${dayLabel}: ${day.title}` : dayLabel;

          return (
            <li key={day.day_number} className="rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => toggleDay(day.day_number)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium hover:bg-muted/40 transition-colors"
              >
                <span>{heading}</span>
                <span className="shrink-0 text-muted-foreground">{isOpen ? "▲" : "▼"}</span>
              </button>
              {isOpen && day.body ? (
                <div className="border-t border-border px-4 pb-4 pt-3">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                    {day.body}
                  </p>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
