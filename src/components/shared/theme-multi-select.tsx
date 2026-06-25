"use client";

import type { JSX, ReactNode } from "react";

import { THEMES } from "@/data/themes";

import { TagMultiSelect, type TagOption } from "./tag-multi-select";

const OPTIONS: TagOption[] = THEMES.map((t) => {
  const Icon = t.Icon;
  return {
    value: t.slug,
    label: t.label,
    icon: <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />,
  };
});

type ThemeMultiSelectProps = {
  /** selected theme slugs */
  value: string[];
  onChange: (next: string[]) => void;
  leading?: ReactNode;
};

/** Theme/interest multi-select — fixed single line, compact chips + "+N". */
export function ThemeMultiSelect({
  value,
  onChange,
  leading,
}: ThemeMultiSelectProps): JSX.Element {
  return (
    <TagMultiSelect
      value={value}
      onChange={onChange}
      options={OPTIONS}
      placeholder="Темы"
      ariaLabel="Выбрать темы"
      searchPlaceholder="Поиск темы…"
      emptyLabel="Тема не найдена"
      leading={leading}
      maxVisibleChips={1}
    />
  );
}

export type { ThemeMultiSelectProps };
