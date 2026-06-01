"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { OpenRequestRecord } from "@/data/open-requests/types";
import { ReqCard } from "@/components/shared/req-card";

const CATEGORY_PILLS = [
  "Все",
  "Природа",
  "Города",
  "Север",
  "Зима",
  "Семейные",
] as const;
type CategoryPill = (typeof CATEGORY_PILLS)[number];

const MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
] as const;

const MONTHS_NOMINATIVE = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
] as const;

function deriveCityFromDestination(label: string): string {
  return label.split(",")[0].trim();
}

function deriveMonthsFromDateLabel(label: string): number[] {
  if (!label) return [];
  const lower = label.toLowerCase();
  const matched: number[] = [];
  MONTHS_GENITIVE.forEach((m, idx) => {
    if (lower.includes(m)) matched.push(idx);
  });
  return matched;
}

function derivePrice(budgetPerPersonRub?: number): string {
  if (!budgetPerPersonRub) return "По договорённости";
  return `${new Intl.NumberFormat("ru-RU").format(budgetPerPersonRub)} ₽ / чел`;
}

interface Props {
  initialData?: OpenRequestRecord[] | null;
}

export function PublicRequestsMarketplaceScreen({ initialData }: Props) {
  const [activeCategory, setActiveCategory] = useState<CategoryPill>("Все");
  const [activeCity, setActiveCity] = useState<string>("Все");
  const [activeMonth, setActiveMonth] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const requests = useMemo(() => initialData ?? [], [initialData]);

  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    requests.forEach((r) => {
      const city = deriveCityFromDestination(r.destinationLabel);
      if (city) set.add(city);
    });
    return ["Все", ...Array.from(set).sort((a, b) => a.localeCompare(b, "ru"))];
  }, [requests]);

  const monthOptions = useMemo(() => {
    const set = new Set<number>();
    requests.forEach((r) => {
      deriveMonthsFromDateLabel(r.dateRangeLabel).forEach((m) => set.add(m));
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (
        searchQuery &&
        !r.destinationLabel.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      if (activeCity !== "Все") {
        if (deriveCityFromDestination(r.destinationLabel) !== activeCity) {
          return false;
        }
      }
      if (activeMonth !== "all") {
        const months = deriveMonthsFromDateLabel(r.dateRangeLabel);
        if (!months.includes(activeMonth)) return false;
      }
      // Category filtering: for demo, "Все" shows all; others filter by keywords in destinationLabel / highlights
      if (activeCategory !== "Все") {
        const haystack = [r.destinationLabel, ...(r.highlights ?? [])]
          .join(" ")
          .toLowerCase();
        const categoryMap: Record<Exclude<CategoryPill, "Все">, string[]> = {
          Природа: [
            "байкал",
            "алтай",
            "карелия",
            "камчатка",
            "природа",
            "лес",
            "гора",
            "степь",
          ],
          Города: [
            "казань",
            "суздаль",
            "калининград",
            "москва",
            "питер",
            "город",
          ],
          Север: ["мурманск", "кольский", "север", "арктика", "ямал"],
          Зима: ["зима", "лёд", "снег", "лыжи", "сноуборд"],
          Семейные: ["семья", "семейн", "дети", "ребёнок"],
        };
        const keywords =
          categoryMap[activeCategory as Exclude<CategoryPill, "Все">] ?? [];
        if (!keywords.some((kw) => haystack.includes(kw))) return false;
      }
      return true;
    });
  }, [requests, activeCategory, activeCity, activeMonth, searchQuery]);

  return (
    <div>
      {/* Page header */}
      <section className="bg-surface-low pb-12 pt-[100px] text-center">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
          <p className="mb-2 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Биржа запросов
          </p>
          <h1 className="font-display text-[clamp(1.875rem,3.5vw,2.375rem)] font-semibold leading-[1.1]">
            Открытые группы путешественников по России
          </h1>
          <p className="mx-auto mt-4 max-w-[760px] text-base leading-[1.65] text-on-surface-muted">
            Выберите направление, присоединяйтесь к формирующейся группе или
            создайте свой запрос — и гиды предложат маршрут под вашу компанию.
          </p>

          {/* Search bar */}
          <div className="mx-auto mt-7 flex w-full max-w-[560px] items-center gap-2.5 rounded-full border border-glass-border bg-glass px-[22px] py-2 shadow-glass backdrop-blur-[20px]">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="shrink-0 text-on-surface-muted"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по направлению или маршруту"
              className="min-w-0 flex-1 border-0 bg-transparent text-[0.9375rem] text-on-surface outline-none placeholder:text-on-surface-muted"
            />
          </div>

          <Button asChild className="mt-5">
            <Link href="/">Создать запрос</Link>
          </Button>
        </div>
      </section>

      {/* Filter pills */}
      <section className="bg-surface py-5">
        <div className="mx-auto flex w-full max-w-page flex-col gap-3 px-[clamp(20px,4vw,48px)]">
          {cityOptions.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <p className="px-1 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Город
              </p>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:flex-wrap md:overflow-visible">
                {cityOptions.map((city) => (
                  <button
                    key={city}
                    type="button"
                    className={`inline-flex shrink-0 cursor-pointer items-center rounded-full border px-3.5 py-[6px] text-sm font-medium transition-all ${
                      activeCity === city
                        ? "border-primary bg-primary text-white"
                        : "border-outline-variant bg-surface-high text-muted-foreground hover:border-primary hover:bg-primary hover:text-white"
                    }`}
                    onClick={() => setActiveCity(city)}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}

          {monthOptions.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="px-1 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Месяц
              </p>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:flex-wrap md:overflow-visible">
                <button
                  type="button"
                  className={`inline-flex shrink-0 cursor-pointer items-center rounded-full border px-3.5 py-[6px] text-sm font-medium transition-all ${
                    activeMonth === "all"
                      ? "border-primary bg-primary text-white"
                      : "border-outline-variant bg-surface-high text-muted-foreground hover:border-primary hover:bg-primary hover:text-white"
                  }`}
                  onClick={() => setActiveMonth("all")}
                >
                  Все
                </button>
                {monthOptions.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`inline-flex shrink-0 cursor-pointer items-center rounded-full border px-3.5 py-[6px] text-sm font-medium transition-all ${
                      activeMonth === m
                        ? "border-primary bg-primary text-white"
                        : "border-outline-variant bg-surface-high text-muted-foreground hover:border-primary hover:bg-primary hover:text-white"
                    }`}
                    onClick={() => setActiveMonth(m)}
                  >
                    {MONTHS_NOMINATIVE[m]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <p className="px-1 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Тематика
            </p>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:flex-wrap md:justify-center md:overflow-visible">
              {CATEGORY_PILLS.map((pill) => (
                <button
                  key={pill}
                  type="button"
                  className={`inline-flex shrink-0 cursor-pointer items-center rounded-full border px-4 py-[7px] text-sm font-medium transition-all ${
                    activeCategory === pill
                      ? "border-primary bg-primary text-white"
                      : "border-outline-variant bg-surface-high text-muted-foreground hover:border-primary hover:bg-primary hover:text-white"
                  }`}
                  onClick={() => setActiveCategory(pill)}
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Requests grid */}
      <section className="bg-surface py-12">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
          {filteredRequests.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredRequests.map((request) => {
                const location = request.destinationLabel.split(",")[0].trim();
                const fillPct = Math.round(
                  (request.group.sizeCurrent / request.group.sizeTarget) * 100,
                );
                return (
                  <ReqCard
                    key={request.id}
                    href={`/requests/${request.id}`}
                    location={location}
                    spotsLabel={`${request.group.sizeCurrent} / ${request.group.sizeTarget} мест`}
                    title={request.highlights[0] ?? request.destinationLabel}
                    date={request.dateRangeLabel}
                    desc={request.highlights[1]}
                    fillPct={fillPct}
                    members={request.members}
                    price={derivePrice(request.budgetPerPersonRub)}
                  />
                );
              })}
            </div>
          ) : (
            <p className="py-12 text-center text-base text-on-surface-muted">
              Ничего не найдено. Попробуйте изменить запрос или фильтр.
            </p>
          )}
        </div>
      </section>

      {/* CTA strip */}
      <section className="bg-surface-low py-12 text-center">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
          <h2 className="mb-[18px] font-display text-[clamp(1.875rem,3vw,2.5rem)] font-semibold text-on-surface">
            Не нашли подходящую группу?
          </h2>
          <p className="mx-auto mb-6 max-w-[480px] text-base text-on-surface-muted">
            Создайте свой запрос — гиды предложат маршрут специально под вашу
            компанию.
          </p>
          <Button asChild>
            <Link href="/">Создать запрос</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
