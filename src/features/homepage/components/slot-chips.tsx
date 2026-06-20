"use client";

import * as React from "react";

import { Calendar, MapPin, Tag, Users } from "lucide-react";

import { THEMES } from "@/data/themes";
import { cn } from "@/lib/utils";

import type { ExtractedFields } from "../lib/extraction";

const THEME_LABEL = new Map(THEMES.map((t) => [t.slug, t.label]));

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(d);
}

function pluralPeople(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "человек";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "человека";
  return "человек";
}

type Chip = { key: string; icon: React.ReactNode; empty: string; value: string | null };

function buildChips(f: ExtractedFields): Chip[] {
  return [
    { key: "destination", icon: <MapPin className="size-4" />, empty: "Город", value: f.destination },
    { key: "startDate", icon: <Calendar className="size-4" />, empty: "Дата", value: f.startDate ? formatDate(f.startDate) : null },
    {
      key: "groupSize",
      icon: <Users className="size-4" />,
      empty: "Сколько",
      value: f.groupSize ? `${f.groupSize} ${pluralPeople(f.groupSize)}` : null,
    },
    {
      key: "budget",
      icon: "₽",
      empty: "Бюджет",
      value: f.budgetPerPersonRub ? `${f.budgetPerPersonRub.toLocaleString("ru-RU")} ₽` : null,
    },
    {
      key: "interests",
      icon: <Tag className="size-4" />,
      empty: "Темы",
      value: f.interests.length
        ? f.interests.map((s) => THEME_LABEL.get(s) ?? s).join(", ")
        : null,
    },
  ];
}

/** Five required-field chips that flip from amber ("missing") to green ("got it"). */
export function SlotChips({ fields, className }: { fields: ExtractedFields; className?: string }) {
  const chips = buildChips(fields);
  const filled = chips.filter((c) => c.value).length;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap justify-center gap-2" aria-label="Распознанные детали запроса">
        {chips.map((chip) => {
          const isFilled = Boolean(chip.value);
          return (
            <span
              key={chip.key}
              data-filled={isFilled}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-300",
                isFilled
                  ? "border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]"
                  : "border-dashed border-[var(--warning)]/40 bg-[var(--warning)]/5 text-[var(--warning)]",
              )}
            >
              <span aria-hidden="true" className="text-sm leading-none">
                {chip.icon}
              </span>
              <span>{chip.value ?? chip.empty}</span>
              {isFilled && (
                <span aria-hidden="true" className="leading-none">
                  ✓
                </span>
              )}
            </span>
          );
        })}
      </div>
      <p className="text-center text-xs text-muted-foreground" aria-live="polite">
        Заполнено {filled} из {chips.length}
      </p>
    </div>
  );
}
