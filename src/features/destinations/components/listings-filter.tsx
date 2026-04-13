"use client";

import * as React from "react";

import { TourCard } from "@/components/shared/tour-card";
import type { ListingRecord } from "@/data/supabase/queries";

const CATEGORIES = [
  "Все",
  "Необычные маршруты",
  "Лучшие",
  "Музеи и искусство",
  "За городом",
  "Уникальный опыт",
  "Активности",
  "Гастрономические",
  "Монастыри и храмы",
  "История и архитектура",
  "Что ещё посмотреть",
  "Активный отдых",
  "Обзорные",
  "Однодневные",
  "Обзорные на автобусе",
  "На автобусе",
  "Ещё",
] as const;

type FormatFilter = "all" | "private" | "group";

interface ListingsFilterProps {
  listings: ListingRecord[];
}

export function ListingsFilter({ listings }: ListingsFilterProps) {
  const [category, setCategory] = React.useState<string>("Все");
  const [formatFilter, setFormatFilter] = React.useState<FormatFilter>("all");

  const filtered = React.useMemo(() => {
    return listings.filter((l) => {
      const fmtOk =
        formatFilter === "all" ||
        (formatFilter === "private" && l.format === "private") ||
        (formatFilter === "group" && (l.format === "group" || l.format === "combo"));
      // Category filter is visual only (no backend category field) — always pass
      return fmtOk;
    });
  }, [listings, formatFilter]);

  return (
    <div className="space-y-4">
      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              category === cat
                ? "bg-foreground text-background"
                : "border border-border/60 bg-background text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Format filter */}
      <div className="flex gap-2">
        {(
          [
            { key: "all", label: "Все форматы" },
            { key: "private", label: "Индивидуальный" },
            { key: "group", label: "Групповой" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFormatFilter(key)}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              formatFilter === key
                ? "bg-primary text-primary-foreground"
                : "border border-border/60 bg-background text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Listings grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((listing) => (
            <TourCard
              key={listing.id}
              href={`/listings/${listing.slug}`}
              imageUrl={listing.imageUrl}
              title={listing.title}
              guide={listing.guideName}
              rating={listing.rating}
              price={`от ${new Intl.NumberFormat("ru-RU").format(Math.round(listing.priceRub / 1000))} тыс. ₽`}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-base text-muted-foreground">Туры по этому фильтру не найдены.</p>
          <button
            type="button"
            onClick={() => {
              setCategory("Все");
              setFormatFilter("all");
            }}
            className="mt-3 text-sm font-medium text-primary underline"
          >
            Сбросить фильтры
          </button>
        </div>
      )}
    </div>
  );
}

