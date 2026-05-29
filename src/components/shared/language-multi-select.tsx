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
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Выбрать языки экскурсии"
          className="flex min-h-11 w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {value.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            value.map((language) => (
              <span
                key={language}
                className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
              >
                {language}
                <X
                  aria-label={`Убрать ${language}`}
                  className="size-3 cursor-pointer"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    toggle(language);
                  }}
                />
              </span>
            ))
          )}
          <ChevronsUpDown
            aria-hidden="true"
            className={cn(
              "ml-auto size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
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
