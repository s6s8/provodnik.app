"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { BUDGET_OPTIONS, INTEREST_CHIPS } from "./step-interests";

type WizardData = {
  // Step 1
  destination: string;
  startDate: string;
  endDate: string;
  groupSize: number;

  // Step 2
  interests: string[];
  budgetKey: "under2k" | "under5k" | "under10k" | "unlimited";
  formatPref: "private" | "group" | "any";

  // Step 3
  notes: string;
};

interface StepDetailsProps {
  data: WizardData;
  isSubmitting: boolean;
  serverError: string | null;
  onBack: () => void;
  onSubmit: () => void;
  onChange: (patch: Partial<WizardData>) => void;
}

function groupSizeLabel(groupSize: number): string {
  if (groupSize <= 1) return "Только я";
  if (groupSize === 2) return "Мы двое";
  return `Группа ${groupSize} чел.`;
}

function parseIsoDate(value: string): Date | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateRangeRu(startIso: string, endIso: string): string {
  const start = parseIsoDate(startIso);
  const end = parseIsoDate(endIso || startIso);
  if (!start) return "Даты не выбраны";
  if (!end) {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
    }).format(start);
  }

  const sameDay = startIso === (endIso || startIso);
  if (sameDay) {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
    }).format(start);
  }

  const sameMonth =
    start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();

  if (sameMonth) {
    const dayStart = new Intl.DateTimeFormat("ru-RU", { day: "numeric" }).format(start);
    const dayEnd = new Intl.DateTimeFormat("ru-RU", { day: "numeric" }).format(end);
    const month = new Intl.DateTimeFormat("ru-RU", { month: "long" }).format(start);
    return `${dayStart}–${dayEnd} ${month}`;
  }

  const startFull = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
  }).format(start);
  const endFull = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
  }).format(end);
  return `${startFull}–${endFull}`;
}

function getInterestLabel(id: string): string {
  return INTEREST_CHIPS.find((c) => c.id === id)?.label ?? id;
}

function getBudgetLabel(
  key: WizardData["budgetKey"],
): string {
  return BUDGET_OPTIONS.find((b) => b.id === key)?.label ?? "—";
}

export function StepDetails({
  data,
  isSubmitting,
  serverError,
  onBack,
  onSubmit,
  onChange,
}: StepDetailsProps) {
  const previewInterests = data.interests.slice(0, 3);
  const dateLabel = formatDateRangeRu(data.startDate, data.endDate || data.startDate);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-xl font-semibold text-foreground">
          Расскажите подробнее
        </h2>
        <p className="text-sm text-muted-foreground">
          Любые детали — как подсказка гиду: что важно, а что точно не хочется.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="notes">
            Пожелания (необязательно)
          </label>
          <Textarea
            id="notes"
            value={data.notes}
            onChange={(e) => onChange({ notes: e.target.value.slice(0, 800) })}
            placeholder="Что хотите увидеть или сделать? Любые детали помогут гидам."
            className="min-h-32"
          />
          <p className="text-xs text-muted-foreground">
            {data.notes.length}/800
          </p>
        </div>

        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <div className="grid gap-3">
            <div className="grid gap-1">
              <p className="text-sm font-medium text-foreground">{data.destination || "—"}</p>
              <p className="text-sm text-muted-foreground">{dateLabel}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border px-3 py-1 text-xs font-medium text-foreground">
                {groupSizeLabel(data.groupSize)}
              </span>
              <span className="rounded-full border px-3 py-1 text-xs font-medium text-foreground">
                {getBudgetLabel(data.budgetKey)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {previewInterests.length ? (
                previewInterests.map((id) => (
                  <span
                    key={id}
                    className="rounded-full border px-3 py-1 text-xs font-medium text-foreground"
                  >
                    {getInterestLabel(id)}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Интересы не выбраны</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          {serverError ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {serverError}
            </div>
          ) : null}

          <Button
            type="button"
            className="h-11 w-full"
            disabled={isSubmitting}
            onClick={onSubmit}
          >
            {isSubmitting ? "Публикуем…" : "Опубликовать запрос"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Ваш запрос увидят проверенные гиды и смогут предложить условия
          </p>

          <Button type="button" variant="ghost" className={cn("h-11 w-full")} onClick={onBack}>
            Назад
          </Button>
        </div>
      </div>
    </div>
  );
}

