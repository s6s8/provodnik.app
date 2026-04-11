"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import type { GuideRecord } from "@/data/supabase/queries";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function PublicGuidesGrid({ guides }: { guides: GuideRecord[] }) {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = normalize(query);
    if (!q) return guides;
    return guides.filter((guide) => {
      const haystack = `${guide.fullName} ${guide.homeBase} ${guide.bio} ${guide.destinations.join(" ")}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [guides, query]);

  return (
    <>
      <div className="mb-8 max-w-xl">
        <label htmlFor="guide-search" className="sr-only">
          Поиск гида
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="guide-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по имени, региону или специализации"
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-on-surface-muted">
          Ничего не найдено. Попробуйте другой запрос.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="block rounded-card bg-surface-high p-6 text-inherit no-underline shadow-card transition-transform hover:-translate-y-[3px]"
            >
              <div className="mb-4 flex items-center gap-4">
                <Avatar className="size-14">
                  <AvatarImage src={guide.avatarUrl ?? undefined} alt={guide.fullName} />
                  <AvatarFallback className="bg-surface-low text-base font-semibold text-primary">
                    {guide.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-base font-semibold text-on-surface">{guide.fullName}</p>
                  <p className="text-[0.8125rem] text-on-surface-muted">{guide.homeBase}</p>
                </div>
              </div>

              <p className="mb-4 line-clamp-2 text-[0.875rem] leading-[1.55] text-on-surface-muted">
                {guide.bio}
              </p>

              <p className="text-[0.8125rem] text-on-surface-muted">
                <span className="text-amber-500">★</span> {guide.rating} · {guide.reviewCount} отзывов
              </p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
