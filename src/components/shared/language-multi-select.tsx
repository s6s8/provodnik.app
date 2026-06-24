"use client";

import type { JSX } from "react";

import { TagMultiSelect } from "./tag-multi-select";

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
  return (
    <TagMultiSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      ariaLabel="Выбрать языки экскурсии"
      searchPlaceholder="Поиск языка…"
      emptyLabel="Ничего не найдено"
    />
  );
}

export type { LanguageMultiSelectProps };
