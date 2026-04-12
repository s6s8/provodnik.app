import type { ListingScheduleRow } from "@/lib/supabase/types";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;

function formatTime(t: string): string {
  const parts = t.split(":");
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return t;
}

function weekdayLabel(weekday: number | null): string {
  if (weekday === null || weekday < 0 || weekday > 6) return "День не указан";
  return WEEKDAYS[weekday];
}

export function ScheduleDisplay({ schedule }: { schedule: ListingScheduleRow[] }) {
  if (schedule.length === 0) return <></>;

  const byDay = new Map<string, ListingScheduleRow[]>();
  for (const row of schedule) {
    const key = row.weekday === null ? "null" : String(row.weekday);
    const list = byDay.get(key) ?? [];
    list.push(row);
    byDay.set(key, list);
  }

  const sortedKeys = [...byDay.keys()].sort((a, b) => {
    if (a === "null") return 1;
    if (b === "null") return -1;
    return Number(a) - Number(b);
  });

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold tracking-tight">Расписание</h2>
      <ul className="space-y-1 text-sm text-muted-foreground">
        {sortedKeys.map((key) => {
          const rows = byDay.get(key) ?? [];
          const label = weekdayLabel(key === "null" ? null : Number(key));
          const slots = rows
            .map((r) => `${formatTime(r.time_start)}–${formatTime(r.time_end)}`)
            .join(", ");
          return (
            <li key={key}>
              {label} — {slots}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
