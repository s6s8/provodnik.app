"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ListingRow } from "@/lib/supabase/types";

import type { SectionProps } from "./BasicsSection";

function val(
  listing: ListingRow,
  draft: Partial<ListingRow>,
  key: "pickup_point_text" | "dropoff_point_text",
): string | null {
  return (key in draft ? draft[key] : listing[key]) as string | null;
}

export function PickupDropoffSection({
  listing,
  draft,
  onChange,
  userId: _userId,
}: SectionProps) {
  const pickup = val(listing, draft, "pickup_point_text") ?? "";
  const dropoff = val(listing, draft, "dropoff_point_text") ?? "";

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="pickup-dropoff-pickup">Место подачи</Label>
        <p className="text-xs text-muted-foreground">
          Точный адрес или ориентир
        </p>
        <Input
          id="pickup-dropoff-pickup"
          required
          value={pickup}
          onChange={(e) => onChange({ pickup_point_text: e.target.value })}
          onBlur={(e) => onChange({ pickup_point_text: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="pickup-dropoff-dropoff">Место назначения</Label>
        <p className="text-xs text-muted-foreground">
          Точный адрес или ориентир
        </p>
        <Input
          id="pickup-dropoff-dropoff"
          required
          value={dropoff}
          onChange={(e) => onChange({ dropoff_point_text: e.target.value })}
          onBlur={(e) => onChange({ dropoff_point_text: e.target.value })}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Точные адреса видны путешественнику только после подтверждения
        бронирования
      </p>
    </div>
  );
}
