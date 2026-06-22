"use client";

import { X } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ActiveFilter = {
  key: string;
  label: string;
};

type SortOption = {
  value: string;
  label: string;
};

type ListToolbarProps = {
  resultCount: number;
  activeFilters?: ActiveFilter[];
  onClearFilter?: (key: string) => void;
  sortOptions?: SortOption[];
  sortValue?: string;
  onSort?: (value: string) => void;
  onClearAll?: () => void;
};

export function ListToolbar({
  resultCount,
  activeFilters,
  onClearFilter,
  sortOptions,
  sortValue,
  onSort,
  onClearAll,
}: ListToolbarProps) {
  const hasFilters = Boolean(activeFilters?.length);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-on-surface font-semibold">{`Найдено ${resultCount}`}</span>

        {activeFilters?.map((filter) => (
          <span
            key={filter.key}
            className="bg-muted rounded-full px-2.5 py-1 text-sm inline-flex items-center gap-1"
          >
            {filter.label}
            <button
              type="button"
              aria-label="Убрать фильтр"
              onClick={() => onClearFilter?.(filter.key)}
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}

        {hasFilters ? (
          <button
            type="button"
            onClick={onClearAll}
            className="text-sm font-medium text-primary hover:underline"
          >
            Очистить всё
          </button>
        ) : null}
      </div>

      {sortOptions?.length ? (
        <Select value={sortValue} onValueChange={onSort}>
          <SelectTrigger size="sm" aria-label="Сортировка">
            <SelectValue placeholder="Сортировка" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}
