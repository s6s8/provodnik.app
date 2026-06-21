"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { ListHero } from "@/components/shared/list-hero";
import { PublicGuideCard } from "@/components/shared/public-guide-card";
import { Input } from "@/components/ui/input";
import { INTEREST_CHIPS } from "@/data/interests";
import type { GuideRecord } from "@/data/supabase/queries";
import { cn } from "@/lib/utils";

function buildGuidesSearch(activeSpecs: string[], q: string): string {
  const params = new URLSearchParams();
  if (activeSpecs.length > 0) {
    params.set("spec", activeSpecs.join(","));
  }
  const trimmed = q.trim();
  if (trimmed.length > 0) {
    params.set("q", trimmed);
  }
  const qs = params.toString();
  return qs.length > 0 ? `?${qs}` : "";
}

export function PublicGuidesGrid({
  guides,
  activeSpecs,
  initialQ,
}: {
  guides: GuideRecord[];
  activeSpecs: string[];
  initialQ?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState(initialQ ?? "");
  const showPartialMatchNotice = guides.length > 0 && guides.some((guide) => guide.isPartialMatch);

  function pushGuides(active: string[], qValue: string) {
    router.push(`/guides${buildGuidesSearch(active, qValue)}`);
  }

  function toggleSpec(id: string) {
    const next = activeSpecs.includes(id)
      ? activeSpecs.filter((s) => s !== id)
      : [...activeSpecs, id];
    pushGuides(next, query);
  }

  function onSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    pushGuides(activeSpecs, query);
  }

  return (
    <>
      <ListHero
        imageUrl="/hero-valley.jpg"
        title="Гиды"
        intro="Найдите проверенного местного гида."
      >
        <form onSubmit={onSearchSubmit}>
          <label htmlFor="guide-search" className="sr-only">
            Поиск гида
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-on-surface-muted"
              aria-hidden="true"
            />
            <Input
              id="guide-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Иван, Казань, английский"
              className="h-12 rounded-[12px] border-transparent bg-surface pl-11 text-on-surface shadow-lg"
            />
          </div>
        </form>
      </ListHero>

      <div className="mt-8 mb-8">
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

      {guides.length === 0 ? (
        <p className="text-on-surface-muted">
          Ничего не найдено. Если вы выбрали темы — попробуйте их сбросить: часть гидов ещё не заполнила
          специализации в профиле и видна только при поиске по имени.
        </p>
      ) : (
        <>
          {showPartialMatchNotice && (
            <p className="mb-4 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm text-on-surface-muted">
              Точных совпадений нет, показываем близкие
            </p>
          )}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((guide) => (
              <PublicGuideCard
                key={guide.slug}
                slug={guide.slug}
                fullName={guide.fullName}
                initials={guide.initials}
                avatarUrl={guide.avatarUrl}
                rating={guide.rating}
                reviewCount={guide.reviewCount}
                experienceYears={guide.experienceYears}
                specialties={guide.specialties}
                tripsCompleted={guide.tripsCompleted}
                recommendPct={guide.recommendPct}
                verified={guide.verified}
                languages={guide.languages}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
