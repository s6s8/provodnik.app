"use client";

import * as React from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "@/lib/utils";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: cn(defaultClassNames.root),
        months: cn("flex flex-col gap-4", defaultClassNames.months),
        month: cn("space-y-4", defaultClassNames.month),
        month_caption: cn("flex h-8 items-center justify-center", defaultClassNames.month_caption),
        caption_label: cn("text-sm font-medium", defaultClassNames.caption_label),
        nav: cn("absolute inset-x-3 top-3 flex items-center justify-between", defaultClassNames.nav),
        button_previous: cn(
          "inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          "inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          defaultClassNames.button_next
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 rounded-md text-[0.8rem] font-normal text-muted-foreground",
          defaultClassNames.weekday
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        day: cn(
          "relative flex size-9 flex-1 cursor-pointer items-center justify-center rounded-md text-sm transition-colors hover:bg-muted",
          defaultClassNames.day
        ),
        today: cn("bg-muted text-foreground", defaultClassNames.today),
        outside: cn("text-muted-foreground opacity-50", defaultClassNames.outside),
        disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
        selected: cn("bg-primary text-primary-foreground hover:bg-primary", defaultClassNames.selected),
        range_start: cn("rounded-l-md bg-primary text-primary-foreground", defaultClassNames.range_start),
        range_middle: cn("rounded-none bg-muted text-foreground", defaultClassNames.range_middle),
        range_end: cn("rounded-r-md bg-primary text-primary-foreground", defaultClassNames.range_end),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      {...props}
    />
  );
}

export { Calendar };
