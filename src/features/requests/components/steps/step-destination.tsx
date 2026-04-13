"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type WizardData = {
  destination: string;
  startDate: string;
  endDate: string;
  groupSize: number;
  interests: string[];
  budgetKey: "under2k" | "under5k" | "under10k" | "unlimited";
  formatPref: "private" | "group" | "any";
  notes: string;
};

interface StepDestinationProps {
  data: Pick<WizardData, "destination" | "startDate" | "endDate" | "groupSize">;
  onChange: (patch: Partial<WizardData>) => void;
  onNext: () => void;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function groupSizeLabel(groupSize: number): string {
  if (groupSize <= 1) return "Только я";
  if (groupSize === 2) return "Мы двое";
  return `Группа ${groupSize} чел.`;
}

export function StepDestination({ data, onChange, onNext }: StepDestinationProps) {
  const todayIso = React.useMemo(() => toIsoDate(new Date()), []);
  const minEndDate = data.startDate || todayIso;

  const canContinue = data.destination.trim().length >= 2 && data.startDate !== "";

  const decDisabled = data.groupSize <= 1;
  const incDisabled = data.groupSize >= 20;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-xl font-semibold text-foreground">
          Куда и когда?
        </h2>
        <p className="text-sm text-muted-foreground">
          Пара строк — и запрос уже начинает оживать.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground" htmlFor="destination">
            Куда хотите?
          </label>
          <Input
            id="destination"
            value={data.destination}
            onChange={(e) => onChange({ destination: e.target.value })}
            placeholder="Казань, Алтай, Байкал…"
            autoComplete="off"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="startDate">
              Дата начала
            </label>
            <Input
              id="startDate"
              type="date"
              min={todayIso}
              value={data.startDate}
              onChange={(e) => {
                const nextStart = e.target.value;
                onChange({
                  startDate: nextStart,
                  endDate:
                    data.endDate && nextStart && data.endDate < nextStart
                      ? ""
                      : data.endDate,
                });
              }}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="endDate">
              Дата окончания
            </label>
            <Input
              id="endDate"
              type="date"
              min={minEndDate}
              value={data.endDate}
              onChange={(e) => onChange({ endDate: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Или оставьте пустым — считается однодневная поездка
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Сколько вас?</p>
              <p className="text-xs text-muted-foreground">
                {groupSizeLabel(data.groupSize)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className={cn("size-9 rounded-full p-0", decDisabled && "opacity-50")}
                disabled={decDisabled}
                aria-label="Уменьшить размер группы"
                onClick={() =>
                  onChange({ groupSize: clampInt(data.groupSize - 1, 1, 20) })
                }
              >
                −
              </Button>
              <div className="min-w-[3.25rem] text-center text-sm font-medium text-foreground">
                {data.groupSize}
              </div>
              <Button
                type="button"
                variant="outline"
                className={cn("size-9 rounded-full p-0", incDisabled && "opacity-50")}
                disabled={incDisabled}
                aria-label="Увеличить размер группы"
                onClick={() =>
                  onChange({ groupSize: clampInt(data.groupSize + 1, 1, 20) })
                }
              >
                +
              </Button>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button type="button" className="h-11 w-full" disabled={!canContinue} onClick={onNext}>
            Далее
          </Button>
        </div>
      </div>
    </div>
  );
}

