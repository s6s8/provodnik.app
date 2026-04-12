"use client";

import { useMemo } from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ListingRow } from "@/lib/supabase/types";

import type { SectionProps } from "./BasicsSection";

const VEHICLE_OPTIONS: { value: string; label: string }[] = [
  { value: "sedan", label: "Седан" },
  { value: "minivan", label: "Минивэн" },
  { value: "suv", label: "Внедорожник" },
  { value: "sprinter", label: "Спринтер (микроавтобус)" },
  { value: "bus", label: "Автобус" },
  { value: "boat", label: "Лодка / катер" },
  { value: "helicopter", label: "Вертолёт" },
  { value: "other", label: "Другое" },
];

function val<K extends keyof ListingRow>(
  listing: ListingRow,
  draft: Partial<ListingRow>,
  key: K,
): ListingRow[K] {
  return (key in draft ? draft[key] : listing[key]) as ListingRow[K];
}

export function VehicleBaggageSection({
  listing,
  draft,
  onChange,
  userId: _userId,
}: SectionProps) {
  const vehicle_type = val(listing, draft, "vehicle_type");
  const baggage_allowance = val(listing, draft, "baggage_allowance");

  const merged = useMemo(
    () => ({ ...listing, ...draft }),
    [listing, draft],
  );

  const selectValue =
    vehicle_type != null && vehicle_type !== ""
      ? vehicle_type
      : "__none__";

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label>Тип транспорта</Label>
        <Select
          value={selectValue}
          onValueChange={(v) =>
            onChange({
              vehicle_type: v === "__none__" ? null : v,
            })
          }
        >
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder="Выберите тип" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__" disabled>
              Выберите тип
            </SelectItem>
            {VEHICLE_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        Вместимость: {merged.max_group_size} пас.
      </p>

      <div className="flex flex-col gap-2">
        <Label htmlFor="vehicle-baggage-allowance">
          Условия перевозки багажа
        </Label>
        <Textarea
          id="vehicle-baggage-allowance"
          rows={3}
          placeholder="Например: до 20 кг в салоне, крупногабаритный багаж за доп. плату"
          value={baggage_allowance ?? ""}
          onChange={(e) => onChange({ baggage_allowance: e.target.value })}
          onBlur={(e) => onChange({ baggage_allowance: e.target.value })}
        />
      </div>
    </div>
  );
}
