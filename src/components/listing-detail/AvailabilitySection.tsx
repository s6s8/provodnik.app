import { CalendarDays } from "lucide-react";

import { formatRussianDate } from "@/lib/dates";
import type { Uuid } from "@/lib/supabase/types";
import { pluralize } from "@/lib/utils";

export type ListingSlotRow = {
  id: Uuid;
  starts_at: string;
  ends_at: string | null;
  capacity: number | null;
  seats_taken: number;
  status: string;
};

export function AvailabilitySection({ slots }: { slots: ListingSlotRow[] }) {
  if (slots.length === 0) {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Доступность</h2>
        <p className="text-sm text-muted-foreground">Даты — по запросу</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight">Ближайшие даты</h2>
      <ul className="flex flex-col gap-2">
        {slots.map((slot) => {
          const seatsLeft = slot.capacity != null ? slot.capacity - slot.seats_taken : null;
          return (
            <li key={slot.id} className="flex items-center gap-2 text-sm">
              <CalendarDays className="size-4 shrink-0 text-primary" />
              <span className="font-medium text-on-surface">{formatRussianDate(slot.starts_at)}</span>
              {slot.capacity != null ? (
                <span className="text-muted-foreground">
                  {seatsLeft} из {slot.capacity} {pluralize(slot.capacity, "место", "места", "мест")}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
