"use client";

import type { JSX } from "react";

import { THEMES } from "@/data/themes";

import { TagMultiSelect } from "./tag-multi-select";

const LABEL_BY_SLUG = new Map<string, string>(THEMES.map((t) => [t.slug, t.label]));
const SLUG_BY_LABEL = new Map<string, string>(THEMES.map((t) => [t.label, t.slug]));
const OPTIONS: string[] = THEMES.map((t) => t.label);

type ThemeMultiSelectProps = {
  /** selected theme slugs */
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
};

/**
 * Theme/interest multi-select, behaving exactly like the language selector
 * (searchable popover + removable chips). Works in slug-space externally but
 * displays human labels.
 */
export function ThemeMultiSelect({
  value,
  onChange,
  placeholder = "Любая тема",
}: ThemeMultiSelectProps): JSX.Element {
  const labels = value
    .map((slug) => LABEL_BY_SLUG.get(slug))
    .filter((label): label is string => Boolean(label));

  return (
    <TagMultiSelect
      value={labels}
      options={OPTIONS}
      placeholder={placeholder}
      ariaLabel="Выбрать темы"
      searchPlaceholder="Поиск темы…"
      emptyLabel="Тема не найдена"
      onChange={(nextLabels) =>
        onChange(
          nextLabels
            .map((label) => SLUG_BY_LABEL.get(label))
            .filter((slug): slug is string => Boolean(slug)),
        )
      }
    />
  );
}

export type { ThemeMultiSelectProps };
