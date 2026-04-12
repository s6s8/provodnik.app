"use client";

import * as React from "react";
import { Star } from "lucide-react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  onChange: (value: number) => void;
  label: string;
  size?: "sm" | "md";
}

export function StarRatingInput({ value, onChange, label, size = "md" }: Props) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const preview = hovered ?? value;
  const iconClass = size === "sm" ? "size-5" : "size-6";

  return (
    <div
      className="grid gap-2"
      onMouseLeave={() => setHovered(null)}
    >
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <div className="flex flex-wrap gap-1" role="group" aria-label={label}>
        {([1, 2, 3, 4, 5] as const).map((star) => {
          const filled = star <= preview;
          return (
            <button
              key={star}
              type="button"
              className={cn(
                "rounded-md p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "text-muted-foreground hover:text-yellow-400/90",
              )}
              aria-label={`${star} из 5`}
              aria-pressed={value === star}
              onMouseEnter={() => setHovered(star)}
              onFocus={() => setHovered(star)}
              onBlur={() => setHovered(null)}
              onClick={() => onChange(star)}
            >
              <Star
                className={cn(
                  iconClass,
                  filled
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-transparent",
                )}
                strokeWidth={filled ? 0 : 1.5}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
