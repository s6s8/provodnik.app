"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { INTEREST_CHIPS } from "@/data/interests";

type WizardData = {
  destination: string;
  startDate: string;
  endDate: string;
  groupSize: number;
  interests: string[];
  budgetKey: "under2k" | "under5k" | "under10k" | "unlimited";
  budgetPerPerson: boolean;
  formatPref: "private" | "group" | "any";
  notes: string;
};


const BUDGET_OPTIONS = [
  { id: "under2k", label: "До 2 000 ₽" },
  { id: "under5k", label: "До 5 000 ₽" },
  { id: "under10k", label: "До 10 000 ₽" },
  { id: "unlimited", label: "Без ограничений" },
] as const;

const FORMAT_OPTIONS = [
  { id: "private", label: "Индивидуально" },
  { id: "group", label: "Готов к группе" },
  { id: "any", label: "Всё равно" },
] as const;

interface StepInterestsProps {
  data: Pick<WizardData, "interests" | "budgetKey" | "budgetPerPerson" | "formatPref">;
  onChange: (patch: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

function toggleArrayItem<T extends string>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

function ChipButton({
  pressed,
  children,
  onClick,
}: {
  pressed: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "h-auto min-h-11 rounded-full border px-4 py-2 text-sm font-medium",
        pressed && "border-primary bg-primary text-primary-foreground",
      )}
    >
      {children}
    </Button>
  );
}

export function StepInterests({
  data,
  onChange,
  onNext,
  onBack,
}: StepInterestsProps) {
  const canContinue = data.interests.length >= 1;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-xl font-semibold text-foreground">
          Что вас интересует?
        </h2>
        <p className="text-sm text-muted-foreground">
          Выберите то, что хочется прямо сейчас — остальное уточним потом.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-3">
          <p className="text-sm font-medium text-foreground">Интересы</p>
          <div className="flex flex-wrap gap-2">
            {INTEREST_CHIPS.map((chip) => {
              const pressed = data.interests.includes(chip.id);
              return (
                <ChipButton
                  key={chip.id}
                  pressed={pressed}
                  onClick={() =>
                    onChange({
                      interests: toggleArrayItem(
                        data.interests,
                        chip.id as WizardData["interests"][number],
                      ),
                    })
                  }
                >
                  {chip.label}
                </ChipButton>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Бюджет</p>
            <div className="flex items-center gap-1 rounded-full border bg-muted p-0.5 text-xs">
              <button
                type="button"
                onClick={() => onChange({ budgetPerPerson: true })}
                className={cn(
                  "rounded-full px-3 py-1 transition-colors",
                  data.budgetPerPerson
                    ? "bg-background font-medium text-foreground shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                за человека
              </button>
              <button
                type="button"
                onClick={() => onChange({ budgetPerPerson: false })}
                className={cn(
                  "rounded-full px-3 py-1 transition-colors",
                  !data.budgetPerPerson
                    ? "bg-background font-medium text-foreground shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                за группу
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {BUDGET_OPTIONS.map((option) => (
              <ChipButton
                key={option.id}
                pressed={data.budgetKey === option.id}
                onClick={() => onChange({ budgetKey: option.id })}
              >
                {option.label}
              </ChipButton>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <p className="text-sm font-medium text-foreground">Формат поездки</p>
          <div className="flex flex-wrap gap-2">
            {FORMAT_OPTIONS.map((option) => (
              <ChipButton
                key={option.id}
                pressed={data.formatPref === option.id}
                onClick={() => onChange({ formatPref: option.id })}
              >
                {option.label}
              </ChipButton>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="button" variant="ghost" className="h-11" onClick={onBack}>
            Назад
          </Button>
          <Button
            type="button"
            className="h-11 flex-1"
            disabled={!canContinue}
            onClick={onNext}
          >
            Далее
          </Button>
        </div>
      </div>
    </div>
  );
}

export { INTEREST_CHIPS, BUDGET_OPTIONS, FORMAT_OPTIONS };

