"use client";

import { useMemo } from "react";

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
import { Toggle } from "@/components/ui/toggle";
import type { ListingRow } from "@/lib/supabase/types";

const FORMAT_LABELS: Record<NonNullable<ListingRow["format"]>, string> = {
  group: "Групповой",
  private: "Индивидуальный",
  combo: "Групповой или индивидуальный",
};

function val<K extends keyof ListingRow>(
  listing: ListingRow,
  draft: Partial<ListingRow>,
  key: K,
): ListingRow[K] {
  return (key in draft ? draft[key] : listing[key]) as ListingRow[K];
}

export interface SectionProps {
  listing: ListingRow;
  draft: Partial<ListingRow>;
  onChange: (patch: Partial<ListingRow>) => void;
  userId: string;
}

export function BasicsSection({
  listing,
  draft,
  onChange,
  userId: _userId,
}: SectionProps) {
  const title = val(listing, draft, "title");
  const description = val(listing, draft, "description");
  const region = val(listing, draft, "region");
  const city = val(listing, draft, "city");
  const format = val(listing, draft, "format");
  const languages = val(listing, draft, "languages");
  const movement_type = val(listing, draft, "movement_type");
  const max_group_size = val(listing, draft, "max_group_size");
  const duration_minutes = val(listing, draft, "duration_minutes");
  const booking_cutoff_hours = val(listing, draft, "booking_cutoff_hours");
  const instant_booking = val(listing, draft, "instant_booking");
  const price_from_minor = val(listing, draft, "price_from_minor");

  const languagesStr = useMemo(() => languages.join(", "), [languages]);

  const durationHint = useMemo(() => {
    if (duration_minutes == null || Number.isNaN(duration_minutes)) return "";
    const h = Math.floor(duration_minutes / 60);
    const m = duration_minutes % 60;
    if (h <= 0) return `${m} мин`;
    if (m === 0) return `${h} ч`;
    return `${h} ч ${m} мин`;
  }, [duration_minutes]);

  const priceRubles =
    price_from_minor != null ? Math.round(price_from_minor / 100) : 0;

  const formatSelectValue =
    format === null || format === undefined ? "__none__" : format;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="basics-title">Название</Label>
        <Input
          id="basics-title"
          required
          value={title}
          onChange={(e) => onChange({ title: e.target.value })}
          onBlur={(e) => onChange({ title: e.target.value.trim() })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="basics-description">Описание</Label>
        <Textarea
          id="basics-description"
          required
          rows={6}
          value={description ?? ""}
          onChange={(e) => onChange({ description: e.target.value })}
          onBlur={(e) => onChange({ description: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Рекомендуем не менее 100 символов
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="basics-region">Регион</Label>
          <Input
            id="basics-region"
            required
            value={region}
            onChange={(e) => onChange({ region: e.target.value })}
            onBlur={(e) => onChange({ region: e.target.value.trim() })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="basics-city">Город (необязательно)</Label>
          <Input
            id="basics-city"
            value={city ?? ""}
            onChange={(e) => onChange({ city: e.target.value || null })}
            onBlur={(e) =>
              onChange({ city: e.target.value.trim() || null })
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Формат</Label>
        <Select
          value={formatSelectValue}
          onValueChange={(v) =>
            onChange({
              format:
                v === "__none__"
                  ? null
                  : (v as NonNullable<ListingRow["format"]>),
            })
          }
        >
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder="Выберите формат" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Не выбрано</SelectItem>
            <SelectItem value="group">{FORMAT_LABELS.group}</SelectItem>
            <SelectItem value="private">{FORMAT_LABELS.private}</SelectItem>
            <SelectItem value="combo">{FORMAT_LABELS.combo}</SelectItem>
          </SelectContent>
        </Select>
        {listing.exp_type && format == null ? (
          <p className="text-xs text-muted-foreground">
            Укажите формат для выбранного типа тура
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="basics-languages">Языки (через запятую)</Label>
        <Input
          id="basics-languages"
          placeholder="Русский, English"
          value={languagesStr}
          onChange={(e) => {
            const parts = e.target.value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            onChange({ languages: parts });
          }}
          onBlur={(e) => {
            const parts = e.target.value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            onChange({ languages: parts });
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="basics-movement">Тип передвижения (необязательно)</Label>
        <Input
          id="basics-movement"
          placeholder="Пешком, На велосипеде…"
          value={movement_type ?? ""}
          onChange={(e) => onChange({ movement_type: e.target.value || null })}
          onBlur={(e) =>
            onChange({ movement_type: e.target.value.trim() || null })
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="basics-max-group">Макс. размер группы</Label>
          <Input
            id="basics-max-group"
            type="number"
            min={1}
            value={max_group_size}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isNaN(n)) onChange({ max_group_size: n });
            }}
            onBlur={(e) => {
              const n = Math.max(1, Number(e.target.value) || 1);
              onChange({ max_group_size: n });
            }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="basics-duration">Длительность (минуты, шаг 15)</Label>
          <Input
            id="basics-duration"
            type="number"
            min={15}
            step={15}
            value={duration_minutes ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") {
                onChange({ duration_minutes: null });
                return;
              }
              const n = Number(raw);
              if (!Number.isNaN(n)) onChange({ duration_minutes: n });
            }}
            onBlur={(e) => {
              const raw = e.target.value;
              if (raw === "") {
                onChange({ duration_minutes: null });
                return;
              }
              const n = Math.max(15, Number(raw) || 15);
              const rounded = Math.round(n / 15) * 15;
              onChange({ duration_minutes: rounded });
            }}
          />
          {durationHint ? (
            <p className="text-xs text-muted-foreground">{durationHint}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="basics-cutoff">
          Бронирование до начала (часов)
        </Label>
        <Input
          id="basics-cutoff"
          type="number"
          min={0}
          value={booking_cutoff_hours}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isNaN(n)) onChange({ booking_cutoff_hours: n });
          }}
          onBlur={(e) => {
            const n = Math.max(0, Number(e.target.value) || 0);
            onChange({ booking_cutoff_hours: n });
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Мгновенное бронирование</Label>
        <Toggle
          variant="outline"
          pressed={instant_booking}
          onPressedChange={(p) => onChange({ instant_booking: p })}
          aria-label="Мгновенное бронирование"
        >
          {instant_booking ? "Включено" : "Выключено"}
        </Toggle>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="basics-price">Цена от (₽)</Label>
        <Input
          id="basics-price"
          type="number"
          min={0}
          step={1}
          value={Number.isFinite(priceRubles) ? priceRubles : 0}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isNaN(n)) onChange({ price_from_minor: n * 100 });
          }}
          onBlur={(e) => {
            const n = Math.max(0, Number(e.target.value) || 0);
            onChange({ price_from_minor: n * 100 });
          }}
        />
      </div>
    </div>
  );
}
