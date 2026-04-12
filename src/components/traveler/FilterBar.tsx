"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "excursion", label: "Экскурсия" },
  { value: "waterwalk", label: "Прогулка на воде" },
  { value: "masterclass", label: "Мастер-класс" },
  { value: "photosession", label: "Фотосессия" },
  { value: "quest", label: "Квест" },
  { value: "activity", label: "Активность" },
  { value: "tour", label: "Тур" },
  { value: "transfer", label: "Трансфер" },
];

const FORMAT_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Любой" },
  { value: "group", label: "Групповой" },
  { value: "private", label: "Индивидуальный" },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "featured", label: "По популярности" },
  { value: "price_asc", label: "Сначала дешевле" },
  { value: "price_desc", label: "Сначала дороже" },
  { value: "rating", label: "По рейтингу" },
];

export interface FilterBarProps {
  currentType?: string;
  currentFormat?: string;
  currentSort?: string;
  currentMinPrice?: string;
  currentMaxPrice?: string;
  q?: string;
  region?: string;
}

export function FilterBar({ currentType, currentFormat, currentSort }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const baseParams = useMemo(() => {
    const next = new URLSearchParams(searchParams.toString());
    return next;
  }, [searchParams]);

  const navigateWithPatch = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(baseParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === "") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [baseParams, pathname, router],
  );

  const sortValue = currentSort && currentSort.length > 0 ? currentSort : "featured";

  return (
    <div className="flex flex-col gap-4 border-b border-border/60 pb-6">
      <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <p className="shrink-0 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Тип
        </p>
        <div className="flex min-w-0 shrink-0 gap-2">
          <button
            type="button"
            onClick={() => navigateWithPatch({ type: undefined })}
            className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Badge variant={!currentType ? "default" : "outline"}>Все</Badge>
          </button>
          {TYPE_OPTIONS.map((opt) => {
            const selected = currentType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => navigateWithPatch({ type: opt.value })}
                className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Badge variant={selected ? "default" : "outline"}>{opt.label}</Badge>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Формат
        </p>
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FORMAT_OPTIONS.map((opt) => {
            const selected =
              opt.value === ""
                ? !currentFormat || currentFormat === ""
                : currentFormat === opt.value;
            return (
              <button
                key={opt.value || "any"}
                type="button"
                onClick={() => navigateWithPatch({ format: opt.value || undefined })}
                className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Badge variant={selected ? "default" : "outline"}>{opt.label}</Badge>
              </button>
            );
          })}
        </div>

        <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto sm:min-w-[220px]">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Сортировка
          </span>
          <Select
            value={sortValue}
            onValueChange={(value) => {
              navigateWithPatch({
                sort: value === "featured" ? undefined : value,
              });
            }}
          >
            <SelectTrigger className="h-9 w-full min-w-[200px] sm:w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
