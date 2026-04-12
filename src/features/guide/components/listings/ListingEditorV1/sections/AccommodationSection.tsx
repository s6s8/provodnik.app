"use client";

import { useCallback, useMemo } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type { SectionProps } from "./BasicsSection";

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "hotel", label: "Отель" },
  { value: "hostel", label: "Хостел" },
  { value: "guesthouse", label: "Гостевой дом" },
  { value: "camping", label: "Кемпинг" },
  { value: "apartment", label: "Апартаменты" },
  { value: "included", label: "Включено в тур" },
  { value: "own", label: "Самостоятельно" },
];

function parseAccommodation(raw: Record<string, unknown> | null): {
  type: string;
  description: string;
  stars: number | null;
} {
  if (!raw || typeof raw !== "object") {
    return { type: "", description: "", stars: null };
  }
  const type =
    typeof raw.type === "string" && raw.type.length > 0 ? raw.type : "";
  const description =
    typeof raw.description === "string" ? raw.description : "";
  let stars: number | null = null;
  if (typeof raw.stars === "number" && Number.isFinite(raw.stars)) {
    stars = raw.stars;
  } else if (typeof raw.stars === "string" && raw.stars.trim() !== "") {
    const n = Number(raw.stars);
    if (!Number.isNaN(n)) stars = n;
  }
  return { type, description, stars };
}

export function AccommodationSection({
  listing,
  draft,
  onChange,
  userId: _userId,
}: SectionProps) {
  const merged = useMemo(
    () => ({ ...listing, ...draft }),
    [listing, draft],
  );

  const { type, description, stars } = useMemo(
    () => parseAccommodation(merged.accommodation),
    [merged.accommodation],
  );

  const emit = useCallback(
    (patch: Partial<{ type: string; description: string; stars: number | null }>) => {
      const next = {
        type: patch.type !== undefined ? patch.type : type,
        description:
          patch.description !== undefined ? patch.description : description,
        stars: patch.stars !== undefined ? patch.stars : stars,
      };
      onChange({
        accommodation: {
          type: next.type,
          description: next.description,
          stars: next.stars,
        },
      });
    },
    [description, onChange, stars, type],
  );

  const typeSelectValue = type === "" ? "__none__" : type;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label>Тип проживания</Label>
        <Select
          value={typeSelectValue}
          onValueChange={(v) =>
            emit({ type: v === "__none__" ? "" : v })
          }
        >
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder="Выберите тип" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Не выбрано</SelectItem>
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="accommodation-desc">Описание проживания</Label>
        <Textarea
          id="accommodation-desc"
          rows={4}
          value={description}
          placeholder="Необязательно"
          onChange={(e) => emit({ description: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="accommodation-stars">
          Звёздность (если отель)
        </Label>
        <Input
          id="accommodation-stars"
          type="number"
          min={1}
          max={5}
          step={1}
          value={stars ?? ""}
          placeholder="Необязательно"
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              emit({ stars: null });
              return;
            }
            const n = Number(raw);
            if (!Number.isNaN(n)) emit({ stars: n });
          }}
        />
      </div>
    </div>
  );
}
