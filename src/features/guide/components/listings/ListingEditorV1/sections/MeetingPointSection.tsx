"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ListingRow } from "@/lib/supabase/types";

import type { SectionProps } from "./BasicsSection";

function merged(
  listing: ListingRow,
  draft: Partial<ListingRow>,
  key: "pickup_point_text" | "dropoff_point_text",
) {
  return (key in draft ? draft[key] : listing[key]) as string | null;
}

export function MeetingPointSection({
  listing,
  draft,
  onChange,
  userId: _userId,
}: SectionProps) {
  const pickupM = merged(listing, draft, "pickup_point_text");
  const dropoffM = merged(listing, draft, "dropoff_point_text");

  const [pickup, setPickup] = useState(pickupM ?? "");
  const [dropoff, setDropoff] = useState(dropoffM ?? "");

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="pickup">Точка встречи / начало</Label>
        <p className="text-xs text-muted-foreground">
          Полный адрес или ориентир
        </p>
        <Input
          id="pickup"
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
          onBlur={() =>
            onChange({ pickup_point_text: pickup.trim() || null })
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="dropoff">Точка окончания / разъезд</Label>
        <p className="text-xs text-muted-foreground">Необязательно</p>
        <Input
          id="dropoff"
          value={dropoff}
          onChange={(e) => setDropoff(e.target.value)}
          onBlur={() =>
            onChange({ dropoff_point_text: dropoff.trim() || null })
          }
        />
      </div>
    </div>
  );
}
