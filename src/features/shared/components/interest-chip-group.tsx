"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { INTEREST_CHIPS } from "@/data/interests";

function toggleArrayItem(arr: string[], value: string): string[] {
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

export function InterestChipGroup({
  name,
  selected,
  onChange,
  ariaLabel,
}: {
  name: string;
  selected: string[];
  onChange: (next: string[]) => void;
  ariaLabel?: string;
}) {
  return (
    <>
      <div
        className="flex flex-wrap gap-2"
        role={ariaLabel ? "group" : undefined}
        aria-label={ariaLabel}
      >
        {INTEREST_CHIPS.map((chip) => {
          const pressed = selected.includes(chip.id);
          return (
            <ChipButton
              key={chip.id}
              pressed={pressed}
              onClick={() => onChange(toggleArrayItem(selected, chip.id))}
            >
              {chip.label}
            </ChipButton>
          );
        })}
      </div>
      {selected.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
    </>
  );
}
