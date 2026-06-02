"use client";

import * as React from "react";

import { THEMES } from "@/data/themes";
import { cn } from "@/lib/utils";

import type { ExtractedFields } from "../lib/extraction";

const THEME_LABEL = new Map(THEMES.map((t) => [t.slug, t.label]));

/** Graphite "liquid chrome" fill for captured chips. */
const CHROME = "linear-gradient(135deg,#3b475e 0%,#5d6d8a 100%)";

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

type Chip = { key: string; icon: string; empty: string; value: string | null };

function buildChips(f: ExtractedFields): Chip[] {
  return [
    { key: "destination", icon: "📍", empty: "Город", value: f.destination },
    { key: "startDate", icon: "📅", empty: "Дата", value: f.startDate ? formatDate(f.startDate) : null },
    {
      key: "groupSize",
      icon: "👥",
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
      icon: "🏷",
      empty: "Темы",
      value: f.interests.length
        ? f.interests.map((s) => THEME_LABEL.get(s) ?? s).join(", ")
        : null,
    },
  ];
}

/**
 * Five required-field chips. Captured fields become solid liquid-chrome glass
 * with a check; missing fields stay frosted/dashed.
 */
export function SlotChips({ fields, className }: { fields: ExtractedFields; className?: string }) {
  const chips = buildChips(fields);
  const filled = chips.filter((c) => c.value).length;

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="flex flex-wrap justify-center gap-2" aria-label="Распознанные детали запроса">
        {chips.map((chip) => {
          const isFilled = Boolean(chip.value);
          return (
            <span
              key={chip.key}
              data-filled={isFilled}
              style={isFilled ? { backgroundImage: CHROME } : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium backdrop-blur-md transition-all duration-300",
                isFilled
                  ? "border border-transparent text-white shadow-[0_8px_20px_-8px_rgba(50,70,110,0.5)]"
                  : "border border-dashed border-white/70 bg-white/45 text-slate-500",
              )}
            >
              <span aria-hidden="true" className="text-sm leading-none">
                {chip.icon}
              </span>
              <span>{chip.value ?? chip.empty}</span>
              {isFilled && (
                <span aria-hidden="true" className="leading-none opacity-90">
                  ✓
                </span>
              )}
            </span>
          );
        })}
      </div>
      <p className="text-xs tracking-wide text-slate-400" aria-live="polite">
        Заполнено {filled} из {chips.length}
      </p>
    </div>
  );
}
