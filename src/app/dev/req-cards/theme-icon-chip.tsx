"use client";

import { useState, type MouseEvent } from "react";
import type { LucideIcon } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type ThemeIconChipProps = {
  label: string;
  Icon: LucideIcon;
};

export function ThemeIconChip({ label, Icon }: ThemeIconChipProps) {
  const [open, setOpen] = useState(false);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setOpen((currentOpen) => !currentOpen);
  }

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={handleClick}
          onBlur={() => setOpen(false)}
          className="inline-flex size-6 cursor-pointer items-center justify-center rounded-full border border-border bg-surface-low text-ink-2 transition-colors hover:border-ink-2/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Icon size={14} className="text-ink-2" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>{label}</TooltipContent>
    </Tooltip>
  );
}
