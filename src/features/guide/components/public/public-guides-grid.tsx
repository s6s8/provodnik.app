"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  DiscoveryFacetChip,
  DiscoveryFacetRail,
  DiscoveryGrid,
  DiscoveryHero,
  DiscoveryResultsCount,
  DiscoveryShell,
  DiscoveryToolbar,
} from "@/components/shared/discovery-shell";
import { DiscoverySearchInput } from "@/components/shared/discovery-search-input";
import { PublicGuideCard } from "@/components/shared/public-guide-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { INTEREST_CHIPS } from "@/data/interests";
import type { GuideRecord } from "@/data/supabase/queries";
import { brandGradient } from "@/lib/city-image";

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

      <DiscoveryToolbar
        facets={
          <DiscoveryFacetRail label="Темы">
            <DiscoveryFacetChip
              active={activeSpecs.length === 0}
              onClick={() => pushGuides([], query)}
            >
              Все
            </DiscoveryFacetChip>
            {INTEREST_CHIPS.map((chip) => {
              const pressed = activeSpecs.includes(chip.id);
              return (
                <DiscoveryFacetChip
                  key={chip.id}
                  active={pressed}
                  pressed={pressed}
                  onClick={() => toggleSpec(chip.id)}
                >
                  {chip.label}
                </DiscoveryFacetChip>
              );
            })}
          </DiscoveryFacetRail>
        }
        count={
          !loadError && guides.length > 0 ? (
            <DiscoveryResultsCount count={guides.length} noun={["гид", "гида", "гидов"]} />
          ) : null
        }
      />

      <DiscoveryShell>
        {loadError ? (
          <Alert variant="destructive">
            <AlertDescription>
              Не удалось загрузить гидов. Попробуйте обновить страницу.
            </AlertDescription>
          </Alert>
        ) : guides.length === 0 ? (
          <p className="text-on-surface-muted">
            {activeSpecs.length === 0
              ? "Пока нет доступных гидов. Скоро здесь появятся проводники — а пока опишите поездку в разделе «Запросы», и гиды откликнутся сами."
              : "Ничего не найдено. Если вы выбрали темы — попробуйте их сбросить: часть гидов ещё не заполнила специализации в профиле и видна только при поиске по имени."}
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
