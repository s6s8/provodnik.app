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
import type { ListingRow } from "@/lib/supabase/types";

import type { SectionProps } from "./BasicsSection";

const LEVEL_OPTIONS: {
  value: NonNullable<ListingRow["difficulty_level"]>;
  label: string;
  hint: string;
}[] = [
  {
    value: "easy",
    label: "🟢 Лёгкий — подходит для всех, нет физических ограничений",
    hint: "Подходит для всех, без серьёзных физических требований.",
  },
  {
    value: "medium",
    label: "🟡 Средний — требуется базовая физическая подготовка",
    hint: "Нужна обычная выносливость и готовность к умеренной нагрузке.",
  },
  {
    value: "hard",
    label: "🔴 Сложный — необходима хорошая физическая форма",
    hint: "Рассчитано на активных путешественников с хорошей формой.",
  },
  {
    value: "extreme",
    label: "⚫ Экстремальный — профессиональная физподготовка",
    hint: "Высокая нагрузка; подходит при подготовке уровня спортсмена.",
  },
];

export function DifficultySection({
  listing,
  draft,
  onChange,
  userId: _userId,
}: SectionProps) {
  const merged = useMemo(
    () => ({ ...listing, ...draft }),
    [listing, draft],
  );

  const level = merged.difficulty_level;
  const selectValue =
    level === null || level === undefined ? "__none__" : level;

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Сложность маршрута</Label>
        <Select
          value={selectValue}
          onValueChange={(v) =>
            onChange({
              difficulty_level:
                v === "__none__"
                  ? null
                  : (v as NonNullable<ListingRow["difficulty_level"]>),
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Выберите сложность" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Не выбрано</SelectItem>
            {LEVEL_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Что это значит для гостей</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          {LEVEL_OPTIONS.map((o) => (
            <li key={o.value}>
              <span className="text-foreground">{o.label.split(" — ")[0]}</span>
              {" — "}
              {o.hint}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
