"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  DiscoveryFilterBar,
  DiscoveryGrid,
  DiscoveryHero,
  DiscoveryShell,
} from "@/components/shared/discovery-shell";
import { DiscoverySearchInput } from "@/components/shared/discovery-search-input";
import { PublicGuideCard } from "@/components/shared/public-guide-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { INTEREST_CHIPS } from "@/data/interests";
import type { GuideRecord } from "@/data/supabase/queries";
import { brandGradient } from "@/lib/city-image";
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
  loadError = false,
  showGuideCta = false,
}: {
  guides: GuideRecord[];
  activeSpecs: string[];
  initialQ?: string;
  loadError?: boolean;
  showGuideCta?: boolean;
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
      <DiscoveryHero
        imageUrl={brandGradient("guides")}
        title="Гиды"
        intro="Найдите проверенного местного гида."
      >
        <form onSubmit={onSearchSubmit}>
          <DiscoverySearchInput
            id="guide-search"
            label="Поиск гида"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Иван, Казань, английский"
          />
        </form>
      </DiscoveryHero>

      <DiscoveryFilterBar>
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
        <div className="-mx-[clamp(20px,4vw,48px)] overflow-x-auto px-[clamp(20px,4vw,48px)]">
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
      </DiscoveryFilterBar>

      <DiscoveryShell>
        {loadError ? (
          <Alert variant="destructive">
            <AlertDescription>
              Не удалось загрузить гидов. Попробуйте обновить страницу.
            </AlertDescription>
          </Alert>
        ) : guides.length === 0 ? (
          <p className="text-on-surface-muted">
            Ничего не найдено. Если вы выбрали темы — попробуйте их сбросить: часть гидов ещё не заполнила
            специализации в профиле и видна только при поиске по имени.
          </p>
        ) : (
          <div className="space-y-4">
            {showPartialMatchNotice && (
              <p className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm text-on-surface-muted">
                Точных совпадений нет, показываем близкие
              </p>
            )}
            <DiscoveryGrid>
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
            </DiscoveryGrid>
          </div>
        )}

        {showGuideCta && (
          <section className="mt-8 rounded-2xl border border-border/60 bg-muted/40 px-8 py-10 text-center">
            <h2 className="font-display text-2xl font-semibold">Вы гид?</h2>
            <p className="mt-2 mx-auto max-w-xl text-base text-muted-foreground">
              Присоединяйтесь к Provodnik — показывайте свои маршруты путешественникам со всей России.
            </p>
            <Button asChild className="mt-6">
              <Link href="/become-a-guide">Стать гидом</Link>
            </Button>
          </section>
        )}
      </DiscoveryShell>
    </>
  );
}
