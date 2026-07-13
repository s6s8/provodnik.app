"use client";

import * as React from "react";

import { TourCard } from "@/components/shared/tour-card";
import { formatRubNumber } from "@/data/money";
import type { ListingRecord } from "@/data/supabase/queries";

type FormatFilter = "all" | "private" | "group";

interface ListingsFilterProps {
  listings: ListingRecord[];
}

export function ListingsFilter({ listings }: ListingsFilterProps) {
  const [formatFilter, setFormatFilter] = React.useState<FormatFilter>("all");

  const filtered = React.useMemo(() => {
    return listings.filter((l) => {
      return (
        formatFilter === "all" ||
        (formatFilter === "private" && l.format === "private") ||
        (formatFilter === "group" && (l.format === "group" || l.format === "combo"))
      );
    });
  }, [listings, formatFilter]);

  return (
    <div className="flex flex-col gap-4">
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
                : "bg-surface-low text-on-surface-muted"
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
              price={`от ${formatRubNumber(listing.priceRub)} ₽`}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-base text-muted-foreground">Туры по этому фильтру не найдены.</p>
          <button
            type="button"
            onClick={() => setFormatFilter("all")}
            className="mt-3 text-sm font-medium text-primary underline"
          >
            Сбросить фильтры
          </button>
        </div>
      )}
    </div>
  );
}

