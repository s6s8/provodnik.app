"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MarketplaceFilterPillsOption<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  value: T;
  options: MarketplaceFilterPillsOption<T>[];
  onChange: (next: T) => void;
  className?: string;
};

export function MarketplaceFilterPills<T extends string>({
  value,
  options,
  onChange,
  className,
}: Props<T>) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/80 px-2 py-1 text-xs text-muted-foreground",
        className
      )}
    >
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant={value === option.value ? "default" : "ghost"}
          size="sm"
          className="rounded-full px-3"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

