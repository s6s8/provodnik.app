"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ListingScheduleExtraRow } from "@/lib/supabase/types";
import {
  blockSlotAction,
  unblockSlotAction,
  blockDayAction,
} from "@/app/(protected)/guide/calendar/actions";

// Generate 48 half-hour slots as "HH:MM:SS" pairs
function generateSlots(): Array<{ start: string; end: string; label: string }> {
  const slots: Array<{ start: string; end: string; label: string }> = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      const endM = (m + 30) % 60;
      const endH = m + 30 >= 60 ? h + 1 : h;
      const eh = String(endH).padStart(2, "0");
      const em = String(endM).padStart(2, "0");
      slots.push({
        start: `${hh}:${mm}:00`,
        end: `${eh}:${em}:00`,
        label: `${hh}:${mm}`,
      });
    }
  }
  return slots;
}

const ALL_SLOTS = generateSlots();

interface DayPanelProps {
  date: string; // "YYYY-MM-DD"
  dateLabel: string;
  listingId: string;
  listingTitle: string;
  extras: ListingScheduleExtraRow[];
  onClose: () => void;
  onExtrasChange: (date: string, newExtras: ListingScheduleExtraRow[]) => void;
}

export function DayPanel({
  date,
  dateLabel,
  listingId,
  listingTitle,
  extras,
  onClose,
  onExtrasChange,
}: DayPanelProps) {
  const [pendingSlot, setPendingSlot] = React.useState<string | null>(null);
  const [blockingDay, setBlockingDay] = React.useState(false);

  // Map time_start → extra row for quick lookup
  const blockedByTime = React.useMemo(() => {
    const m = new Map<string, ListingScheduleExtraRow>();
    for (const e of extras.filter((e) => e.listing_id === listingId && e.date === date)) {
      if (e.time_start) m.set(e.time_start, e);
    }
    return m;
  }, [extras, listingId, date]);

  const handleSlotClick = async (slot: { start: string; end: string }) => {
    const existing = blockedByTime.get(slot.start);
    if (existing) {
      // Unblock
      setPendingSlot(slot.start);
      const result = await unblockSlotAction(existing.id);
      if (result.ok) {
        const newExtras = extras.filter((e) => e.id !== existing.id);
        onExtrasChange(date, newExtras);
      }
      setPendingSlot(null);
    } else {
      // Block
      if (!window.confirm(`Закрыть слот ${slot.start.slice(0, 5)}–${slot.end.slice(0, 5)}?`)) return;
      setPendingSlot(slot.start);
      const result = await blockSlotAction(listingId, date, slot.start, slot.end);
      if (result.ok) {
        const newExtra: ListingScheduleExtraRow = {
          id: result.id,
          listing_id: listingId,
          date,
          time_start: slot.start,
          time_end: slot.end,
        };
        onExtrasChange(date, [...extras, newExtra]);
      }
      setPendingSlot(null);
    }
  };

  const handleBlockDay = async () => {
    if (!window.confirm(`Закрыть весь день ${dateLabel} для тура "${listingTitle}"?`)) return;
    setBlockingDay(true);
    const result = await blockDayAction(listingId, date);
    if (result.ok) {
      // We don't have real IDs for the new rows — signal parent to close panel
      onExtrasChange(date, []);
    }
    setBlockingDay(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} aria-hidden />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`День ${dateLabel}`}
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[360px] flex-col bg-surface shadow-xl max-md:max-w-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{dateLabel}</h2>
            <p className="text-xs text-muted-foreground">{listingTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Slots list */}
        <div className="flex-1 overflow-y-auto space-y-1 px-4 py-3">
          {ALL_SLOTS.map((slot) => {
            const isBlocked = blockedByTime.has(slot.start);
            const isPending = pendingSlot === slot.start;
            return (
              <button
                key={slot.start}
                type="button"
                onClick={() => void handleSlotClick(slot)}
                disabled={isPending || blockingDay}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  isBlocked
                    ? "bg-muted/80 text-muted-foreground line-through cursor-pointer hover:bg-muted"
                    : "bg-background border border-border/60 text-foreground hover:bg-muted/50"
                } ${isPending ? "opacity-50" : ""}`}
              >
                {slot.label}
                {isBlocked ? (
                  <span className="ml-2 text-xs text-muted-foreground">— закрыто</span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-destructive hover:text-destructive"
            disabled={blockingDay}
            onClick={() => void handleBlockDay()}
          >
            {blockingDay ? "Закрываем день…" : "Закрыть день"}
          </Button>
        </div>
      </div>
    </>
  );
}
