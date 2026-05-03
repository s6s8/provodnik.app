"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { INTEREST_CHIPS } from "@/data/interests";
import type { GuideRecord } from "@/data/supabase/queries";
import { cn } from "@/lib/utils";

function pluralizeExcursions(n: number): string {
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 14) return `${n} экскурсий`;
  if (mod10 === 1) return `${n} экскурсия`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} экскурсии`;
  return `${n} экскурсий`;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function PublicGuidesGrid({
  guides,
  activeSpecs,
}: {
  guides: GuideRecord[];
  activeSpecs: string[];
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  function toggleSpec(id: string) {
    const next = activeSpecs.includes(id)
      ? activeSpecs.filter((s) => s !== id)
      : [...activeSpecs, id];
    const qs = next.length > 0 ? `?spec=${next.join(",")}` : "";
    router.push(`/guides${qs}`);
  }

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
            placeholder="Поиск по имени или региону"
            className="pl-9"
          />
        </div>
      </div>

      <div className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <p className="text-sm font-medium text-on-surface">Темы:</p>
          {activeSpecs.length > 0 && (
            <Link
              href="/guides"
              className="text-sm text-on-surface-muted underline underline-offset-2 hover:text-on-surface"
            >
              Сбросить
            </Link>
          )}
        </div>
        <div className="-mx-[clamp(20px,4vw,48px)] overflow-x-auto px-[clamp(20px,4vw,48px)] sm:mx-0 sm:px-0">
          <div className="flex flex-nowrap gap-2 whitespace-nowrap">
            {INTEREST_CHIPS.map((chip) => {
              const pressed = activeSpecs.includes(chip.id);
              return (
                <button
                  key={chip.id}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => toggleSpec(chip.id)}
                  className={cn(
                    "inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    pressed
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface text-on-surface hover:bg-surface-high",
                  )}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
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
              {guide.listingCount != null && (
                <p className="text-[0.8125rem] text-on-surface-muted">
                  {pluralizeExcursions(guide.listingCount)}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
