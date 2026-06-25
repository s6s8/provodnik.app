"use client";

import type { JSX, ReactNode } from "react";

import { TagMultiSelect, type TagOption } from "./tag-multi-select";

type LanguageMultiSelectProps = {
  value: string[];
  onChange: (next: string[]) => void;
  options: readonly string[];
  placeholder?: string;
  leading?: ReactNode;
};

export function LanguageMultiSelect({
  value,
  onChange,
  options,
  placeholder = "Любой язык",
  leading,
}: LanguageMultiSelectProps): JSX.Element {
  const opts: TagOption[] = options.map((l) => ({ value: l, label: l }));
  return (
    <TagMultiSelect
      value={value}
      onChange={onChange}
      options={opts}
      placeholder={placeholder}
      ariaLabel="Выбрать языки экскурсии"
      searchPlaceholder="Поиск языка…"
      emptyLabel="Ничего не найдено"
      leading={leading}
      maxVisibleChips={1}
    />
  );
}

export type { LanguageMultiSelectProps };
