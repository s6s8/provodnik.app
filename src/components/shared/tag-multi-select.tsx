"use client";

import { useState, type JSX } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

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

type TagMultiSelectProps = {
  value: string[];
  onChange: (next: string[]) => void;
  options: readonly string[];
  placeholder?: string;
  ariaLabel?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
};

/**
 * Generic searchable multi-select. Shows selected values as removable chips and
 * opens a searchable popover menu for the rest. Domain-specific wrappers
 * (LanguageMultiSelect, ThemeMultiSelect) set the labels.
 */
export function TagMultiSelect({
  value,
  onChange,
  options,
  placeholder = "Выбрать",
  ariaLabel = "Выбрать значения",
  searchPlaceholder = "Поиск…",
  emptyLabel = "Ничего не найдено",
}: TagMultiSelectProps): JSX.Element {
  const [open, setOpen] = useState(false);

  const toggle = (item: string) => {
    onChange(
      value.includes(item)
        ? value.filter((entry) => entry !== item)
        : [...value, item],
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        {value.length === 0 ? (
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={ariaLabel}
              className="flex min-h-6 flex-1 cursor-pointer items-center justify-between gap-2 text-left focus-visible:outline-none"
            >
              <span className="text-muted-foreground">{placeholder}</span>
              <ChevronsUpDown
                aria-hidden="true"
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
                  open && "rotate-180",
                )}
              />
            </button>
          </PopoverTrigger>
        ) : (
          <>
            {value.map((item) => (
              <span
                key={item}
                className="flex items-center gap-1 rounded-full bg-primary/10 py-0.5 pl-2 pr-1 text-xs text-primary"
              >
                {item}
                <button
                  type="button"
                  aria-label={`Убрать ${item}`}
                  className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    toggle(item);
                  }}
                >
                  <X aria-hidden="true" className="size-3" />
                </button>
              </span>
            ))}
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={ariaLabel}
                className="ml-auto flex min-h-6 min-w-6 flex-1 cursor-pointer items-center justify-end rounded-full text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <ChevronsUpDown
                  aria-hidden="true"
                  className={cn("size-4 transition-transform", open && "rotate-180")}
                />
              </button>
            </PopoverTrigger>
          </>
        )}
      </div>
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
              {options.map((item) => {
                const selected = value.includes(item);

                return (
                  <CommandItem
                    key={item}
                    value={item}
                    data-checked={selected}
                    onSelect={() => toggle(item)}
                  >
                    <Check
                      aria-hidden="true"
                      className={cn(
                        "mr-2 size-4",
                        selected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {item}
                  </CommandItem>
                );
              })}
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
