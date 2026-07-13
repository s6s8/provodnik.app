"use client";

import { useState, type JSX, type ReactNode } from "react";
import { ChevronsUpDown } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type TagOption = {
  value: string;
  label: string;
  /** Optional compact icon shown inside the selected chip. */
  icon?: ReactNode;
};

type TagMultiSelectProps = {
  value: string[];
  onChange: (next: string[]) => void;
  options: readonly TagOption[];
  placeholder?: string;
  ariaLabel?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  /** Leading field icon (already wrapped with a tooltip by the caller). */
  leading?: ReactNode;
  /** How many chips to show before collapsing the rest into "+N". */
  maxVisibleChips?: number;
};

/**
 * Generic searchable multi-select with a FIXED single-line trigger: selected
 * items render as compact chips, and anything beyond `maxVisibleChips`
 * collapses into a "+N" pill (so the control never grows or jumps). The popover
 * menu shows a single right-aligned tick per item (from CommandItem).
 */
export function TagMultiSelect({
  value,
  onChange,
  options,
  placeholder = "Выбрать",
  ariaLabel = "Выбрать значения",
  searchPlaceholder = "Поиск…",
  emptyLabel = "Ничего не найдено",
  leading,
  maxVisibleChips = 2,
}: TagMultiSelectProps): JSX.Element {
  const [open, setOpen] = useState(false);

  const toggle = (item: string) => {
    onChange(
      value.includes(item)
        ? value.filter((entry) => entry !== item)
        : [...value, item],
    );
  };

  const selected = options.filter((o) => value.includes(o.value));
  const visible = selected.slice(0, maxVisibleChips);
  const overflow = selected.length - visible.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className="flex h-[46px] w-full items-center gap-[11px] overflow-hidden rounded-step border border-border bg-surface px-[13px] text-left transition-[border-color,box-shadow] focus:border-primary focus:shadow-[0_0_0_3px_rgba(26,86,164,0.12)] focus:outline-none"
        >
          {leading}
          <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
            {selected.length === 0 ? (
              <span className="truncate text-sm font-semibold text-placeholder">
                {placeholder}
              </span>
            ) : (
              <>
                {visible.map((o) => (
                  <span
                    key={o.value}
                    className="inline-flex h-6 max-w-[110px] shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary"
                  >
                    {o.icon}
                    <span className="truncate">{o.label}</span>
                  </span>
                ))}
                {overflow > 0 ? (
                  <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-primary/10 px-2 text-xs font-bold text-primary">
                    +{overflow}
                  </span>
                ) : null}
              </>
            )}
          </span>
          <ChevronsUpDown
            aria-hidden="true"
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="min-w-64 w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command
          filter={(itemValue, search) =>
            itemValue.toLocaleLowerCase("ru").includes(search.toLocaleLowerCase("ru"))
              ? 1
              : 0
          }
        >
          <CommandInput placeholder={searchPlaceholder} autoFocus />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={o.label}
                  data-checked={value.includes(o.value)}
                  onSelect={() => toggle(o.value)}
                >
                  {o.icon}
                  {o.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted-foreground">
            <button
              type="button"
              className="cursor-pointer text-primary hover:underline"
              onClick={() => onChange([])}
            >
              Очистить
            </button>
            <span>Выбрано: {value.length}</span>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export type { TagMultiSelectProps };
