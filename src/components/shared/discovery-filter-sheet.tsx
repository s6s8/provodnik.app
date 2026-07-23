"use client";

import { useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type DiscoveryFilterSheetProps = {
  /** Sheet/popover heading. */
  title: string;
  /** Short helper line under the title (mobile sheet). */
  description: string;
  /** Number of active advanced filters — shown as a badge on the trigger. */
  activeCount?: number;
  /** Filter body; receives a `close` callback to dismiss after applying. */
  children: (close: () => void) => ReactNode;
};

/**
 * Discovery-family advanced-filter trigger — one "Фильтры" button that opens a
 * Popover on desktop (md+) and a bottom Sheet on mobile. Replaces the per-page
 * clusters of inline dropdown buttons so advanced facets live behind a single,
 * consistent entry point across the discovery family.
 */
export function DiscoveryFilterSheet({
  title,
  description,
  activeCount = 0,
  children,
}: DiscoveryFilterSheetProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const trigger = (
    <Button type="button" variant="outline" className="cursor-pointer gap-2">
      <SlidersHorizontal className="size-4" aria-hidden />
      Фильтры
      {activeCount > 0 ? (
        <Badge variant="default" className="h-5 min-w-5 px-1.5 tabular-nums">
          {activeCount}
        </Badge>
      ) : null}
    </Button>
  );

  return (
    <>
      <div className="hidden md:block">
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent align="end" className="w-[340px] p-0">
            {children(() => setIsPopoverOpen(false))}
          </PopoverContent>
        </Popover>
      </div>
      <div className="md:hidden">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>{trigger}</SheetTrigger>
          <SheetContent side="bottom" className="flex max-h-[85vh] flex-col rounded-t-card p-0">
            <SheetHeader className="shrink-0">
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>{description}</SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              {children(() => setIsSheetOpen(false))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
