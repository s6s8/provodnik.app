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

type LanguageMultiSelectProps = {
  value: string[];
  onChange: (next: string[]) => void;
  options: readonly string[];
  placeholder?: string;
};

export function LanguageMultiSelect({
  value,
  onChange,
  options,
  placeholder = "Любой язык",
}: LanguageMultiSelectProps): JSX.Element {
  const [open, setOpen] = useState(false);

  const toggle = (language: string) => {
    onChange(
      value.includes(language)
        ? value.filter((item) => item !== language)
        : [...value, language],
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        {value.length === 0 ? (
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Выбрать языки экскурсии"
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
            {value.map((language) => (
              <span
                key={language}
                className="flex items-center gap-1 rounded-full bg-primary/10 py-0.5 pl-2 pr-1 text-xs text-primary"
              >
                {language}
                <button
                  type="button"
                  aria-label={`Убрать ${language}`}
                  className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    toggle(language);
                  }}
                >
                  <X aria-hidden="true" className="size-3" />
                </button>
              </span>
            ))}
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Выбрать языки экскурсии"
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
          <CommandInput placeholder="Поиск языка…" autoFocus />
          <CommandList>
            <CommandEmpty>Ничего не найдено</CommandEmpty>
            <CommandGroup>
              {options.map((language) => {
                const selected = value.includes(language);

                return (
                  <CommandItem
                    key={language}
                    value={language}
                    data-checked={selected}
                    onSelect={() => toggle(language)}
                  >
                    <Check
                      aria-hidden="true"
                      className={cn(
                        "mr-2 size-4",
                        selected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {language}
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

export type { LanguageMultiSelectProps };
