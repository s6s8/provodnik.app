"use client";

import { useMemo, useState } from "react";

import { ReqCard } from "@/components/shared/req-card";
import type { OpenRequestRecord } from "@/data/open-requests/types";

const CATEGORY_PILLS = [
  "Все",
  "История",
  "Архитектура",
  "Природа",
  "Гастрономия",
  "Искусство",
  "Религия",
  "Для детей",
  "Необычное",
] as const;
type CategoryPill = (typeof CATEGORY_PILLS)[number];

const MONTHS_GENITIVE = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
] as const;

const MONTHS_NOMINATIVE = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
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

type Props = {
  initialData: OpenRequestRecord[] | null;
};

function derivePrice(budgetPerPersonRub?: number): string {
  if (!budgetPerPersonRub) return "По договоренности";
  return `${new Intl.NumberFormat("ru-RU").format(budgetPerPersonRub)} ₽ / чел`;
}

function getSearchText(request: OpenRequestRecord): string {
  return [
    request.destinationLabel,
    request.regionLabel,
    request.dateRangeLabel,
    ...request.highlights,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function PublicRequestsMarketplaceScreen({ initialData }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryPill>("Все");
  const [activeCity, setActiveCity] = useState<string>("Все");
  const [activeMonth, setActiveMonth] = useState<number | "all">("all");

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
    const normalizedQuery = query.trim().toLowerCase();
    const categoryMap: Record<Exclude<CategoryPill, "Все">, string[]> = {
      История: ["история", "исторический", "музей", "крепость", "памятник", "летопись"],
      Архитектура: ["архитектур", "усадьба", "зодчество", "особняк", "дворец"],
      Природа: ["байкал", "алтай", "карелия", "камчатка", "природа", "лес", "гора", "степь", "озеро"],
      Гастрономия: ["гастроном", "кухня", "ресторан", "рынок", "еда", "дегустац"],
      Искусство: ["искусство", "театр", "галерея", "выставка", "художник"],
      Религия: ["монастырь", "церковь", "храм", "мечеть", "собор", "паломничество", "религи"],
      "Для детей": ["дети", "ребёнок", "семья", "семейн", "детск"],
      Необычное: ["необычн", "квест", "приключен", "мистик", "тайн", "экстрим"],
    };

    return requests.filter((request) => {
      const searchText = getSearchText(request);
      const matchesQuery = !normalizedQuery || searchText.includes(normalizedQuery);
      const matchesCategory =
        category === "Все" ||
        categoryMap[category].some((token) => searchText.includes(token));
      const matchesCity =
        activeCity === "Все" ||
        deriveCityFromDestination(request.destinationLabel) === activeCity;
      const matchesMonth =
        activeMonth === "all" ||
        deriveMonthsFromDateLabel(request.dateRangeLabel).includes(activeMonth);

      return matchesQuery && matchesCategory && matchesCity && matchesMonth;
    });
  }, [category, query, requests, activeCity, activeMonth]);

  return (
    <div>
      <section className="bg-surface py-sec-pad">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)] text-center">
          <h1 className="mx-auto max-w-[780px] font-display text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[1.02] text-foreground">
            Открытые запросы на экскурсию
          </h1>
          <p className="mx-auto mt-4 max-w-[620px] text-base leading-[1.65] text-muted-foreground">
            Выберите направление, дату и присоединяйтесь к формирующейся группе
          </p>

          <div className="mx-auto mt-7 max-w-[640px]">
            <label htmlFor="requests-search" className="sr-only">
              Поиск по запросам
            </label>
            <input
              id="requests-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Направление, дата или тема"
              className="h-12 w-full rounded-full border border-border bg-surface-high px-5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
        </div>
      </section>

      <section className="bg-surface-low py-8">
        <div className="mx-auto w-full max-w-page flex flex-col gap-5 px-[clamp(20px,4vw,48px)]">
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
                    onClick={() => setActiveCity(city)}
                    className={`inline-flex shrink-0 cursor-pointer items-center rounded-full border px-3.5 py-[6px] text-sm font-medium transition-all ${
                      activeCity === city
                        ? "border-primary bg-primary text-white"
                        : "border-outline-variant bg-surface-high text-muted-foreground hover:border-primary hover:bg-primary hover:text-white"
                    }`}
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
                  onClick={() => setActiveMonth("all")}
                  className={`inline-flex shrink-0 cursor-pointer items-center rounded-full border px-3.5 py-[6px] text-sm font-medium transition-all ${
                    activeMonth === "all"
                      ? "border-primary bg-primary text-white"
                      : "border-outline-variant bg-surface-high text-muted-foreground hover:border-primary hover:bg-primary hover:text-white"
                  }`}
                >
                  Все
                </button>
                {monthOptions.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setActiveMonth(m)}
                    className={`inline-flex shrink-0 cursor-pointer items-center rounded-full border px-3.5 py-[6px] text-sm font-medium transition-all ${
                      activeMonth === m
                        ? "border-primary bg-primary text-white"
                        : "border-outline-variant bg-surface-high text-muted-foreground hover:border-primary hover:bg-primary hover:text-white"
                    }`}
                  >
                    {MONTHS_NOMINATIVE[m]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <p className="px-1 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">Тематика</p>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:flex-wrap md:overflow-visible">
              {CATEGORY_PILLS.map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => setCategory(pill)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    category === pill
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface-high text-foreground hover:border-primary"
                  }`}
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-sec-pad">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
          {filteredRequests.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredRequests.map((request) => {
                const location = request.destinationLabel.split(",")[0].trim();
                const isOpenGroup =
                  request.group.openToMoreMembers &&
                  request.group.sizeTarget === request.group.sizeCurrent;
                const fillPct = isOpenGroup
                  ? Math.min(60, request.group.sizeCurrent * 15)
                  : Math.round(
                      (request.group.sizeCurrent / request.group.sizeTarget) * 100,
                    );
                const spotsLabel = isOpenGroup
                  ? `${request.group.sizeCurrent} участников`
                  : `${request.group.sizeCurrent} / ${request.group.sizeTarget} мест`;

                return (
                  <ReqCard
                    key={request.id}
                    href={`/requests/${request.id}`}
                    location={location}
                    spotsLabel={spotsLabel}
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
            <div className="rounded-card bg-surface-high p-8 text-center shadow-card">
              <p className="font-display text-[1.5rem] font-semibold text-foreground">
                Подходящих запросов пока нет
              </p>
              <p className="mx-auto mt-2 max-w-[460px] text-sm leading-[1.6] text-muted-foreground">
                Попробуйте изменить направление или выбрать другую тематику.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
