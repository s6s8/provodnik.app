"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Check, Compass } from "lucide-react";

import {
  DiscoveryActiveFilters,
  DiscoveryFacetChip,
  DiscoveryFacetRail,
  DiscoveryGrid,
  DiscoveryHero,
  DiscoveryResultsCount,
  DiscoveryShell,
  DiscoveryToolbar,
} from "@/components/shared/discovery-shell";
import { DiscoveryFilterSheet } from "@/components/shared/discovery-filter-sheet";
import { DiscoverySearchInput } from "@/components/shared/discovery-search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { OpenGroupCard } from "@/components/shared/open-group-card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { OpenRequestRecord } from "@/data/open-requests/types";
import { THEMES } from "@/data/themes";
import { brandGradient, cityImage } from "@/lib/city-image";
import { todayMoscowISODate } from "@/lib/dates";
import { formatRubNumber } from "@/data/money";

type CategoryFilter = (typeof THEMES)[number]["label"];

const CATEGORY_FILTERS: CategoryFilter[] = THEMES.map((theme) => theme.label);

const CATEGORY_INTEREST_SLUGS = Object.fromEntries(
  THEMES.map((theme) => [theme.label, theme.slug] as const),
) as Record<CategoryFilter, string>;

const CATEGORY_TOKENS: Record<CategoryFilter, string[]> = {
  "История и культура": [
    "история",
    "исторический",
    "музей",
    "крепость",
    "памятник",
    "летопись",
    "архитектур",
    "усадьба",
    "зодчество",
    "особняк",
    "дворец",
  ],
  Природа: ["байкал", "алтай", "карелия", "камчатка", "природа", "лес", "гора", "степь", "озеро"],
  Гастрономия: ["гастроном", "кухня", "ресторан", "рынок", "еда", "дегустац"],
  Искусство: ["искусство", "театр", "галерея", "выставка", "художник"],
  "Необычные маршруты": ["необычн", "квест", "приключен", "мистик", "тайн", "экстрим"],
  "Ночные прогулки": ["ноч", "вечер", "огни", "закат", "рассвет"],
  "Активный отдых": ["актив", "спорт", "поход", "велосипед", "дети", "ребёнок", "семья", "семейн", "детск"],
  "Водные прогулки": ["вода", "лодка", "катер", "река", "канал", "море", "озеро"],
  "Религия и духовность": ["монастырь", "церковь", "храм", "мечеть", "собор", "паломничество", "религи"],
};

function requestMatchesCategory(request: OpenRequestRecord, category: CategoryFilter): boolean {
  const slug = CATEGORY_INTEREST_SLUGS[category] ?? "";
  if (request.interests?.includes(slug)) return true;
  const searchText = getSearchText(request);
  return CATEGORY_TOKENS[category].some((token) => searchText.includes(token));
}

const MONTHS_GENITIVE = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
] as const;

const WHEN_PRESETS = [
  { value: "this-week", label: "На этой неделе" },
  { value: "this-month", label: "В этом месяце" },
  { value: "next-month", label: "В следующем месяце" },
  { value: "flexible", label: "Гибкие даты" },
] as const;
const REQUESTS_PAGE_SIZE = 9;

// Selected option = primary fill; overrides the muted default of the toggle variant.
const TOGGLE_ACTIVE_CLASS =
  "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground";
type WhenPreset = (typeof WHEN_PRESETS)[number]["value"];
type ActiveDateRange = { from?: Date; to?: Date };

type Props = {
  initialData: OpenRequestRecord[] | null;
};

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

function getSearchText(request: OpenRequestRecord): string {
  return request.highlights
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

// Free-text search must match what the placeholder promises: город, регион, локация.
// destinationLabel carries the city/location; regionLabel the region (may be empty).
// Kept separate from getSearchText so category counting stays title/description-only.
export function getQueryText(request: OpenRequestRecord): string {
  return [request.destinationLabel, request.regionLabel, ...request.highlights]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getCurrentMonthIndex(): number {
  const [, month] = todayMoscowISODate().split("-").map(Number);
  return Math.max(0, Math.min(11, (month ?? 1) - 1));
}

function getTargetMonths(preset: WhenPreset): number[] {
  const currentMonth = getCurrentMonthIndex();
  if (preset === "next-month") return [(currentMonth + 1) % 12];
  if (preset === "flexible") return [];
  return [currentMonth];
}

function getWhenLabel(preset: WhenPreset): string {
  return WHEN_PRESETS.find((option) => option.value === preset)?.label ?? "";
}

function getDateRangeMonths(range: ActiveDateRange): number[] {
  if (!range.from) return [];

  const fromMonth = range.from.getMonth();
  const toMonth = range.to?.getMonth() ?? fromMonth;
  if (fromMonth <= toMonth) {
    return Array.from({ length: toMonth - fromMonth + 1 }, (_, index) => fromMonth + index);
  }

  return [
    ...Array.from({ length: 12 - fromMonth }, (_, index) => fromMonth + index),
    ...Array.from({ length: toMonth + 1 }, (_, index) => index),
  ];
}

function formatDateRangeLabel(range: ActiveDateRange): string {
  if (!range.from) return "";
  if (!range.to || range.from.getTime() === range.to.getTime()) {
    return format(range.from, "d MMMM", { locale: ru });
  }

  if (range.from.getMonth() === range.to.getMonth()) {
    return `${format(range.from, "d", { locale: ru })} – ${format(range.to, "d MMMM", { locale: ru })}`;
  }

  return `${format(range.from, "d MMMM", { locale: ru })} – ${format(range.to, "d MMMM", { locale: ru })}`;
}

export function PublicRequestsMarketplaceScreen({ initialData }: Props) {
  const [query, setQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<CategoryFilter[]>([]);
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [activeWhen, setActiveWhen] = useState<WhenPreset | null>(null);
  const [activeDateRange, setActiveDateRange] = useState<ActiveDateRange | null>(null);
  const [hasLoadedStoredCity, setHasLoadedStoredCity] = useState(false);
  const [visibleCount, setVisibleCount] = useState(REQUESTS_PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const requests = useMemo(() => initialData ?? [], [initialData]);

  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    requests.forEach((r) => {
      const city = deriveCityFromDestination(r.destinationLabel);
      if (city) set.add(city);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
  }, [requests]);

  useEffect(() => {
    if (hasLoadedStoredCity || cityOptions.length === 0) return;

    const timer = window.setTimeout(() => {
      try {
        const savedCity = window.localStorage.getItem("requests-city");
        if (savedCity && cityOptions.includes(savedCity)) {
          setActiveCity(savedCity);
        }
      } catch {
        // Best effort only: storage can be unavailable in private or restricted contexts.
      } finally {
        setHasLoadedStoredCity(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [cityOptions, hasLoadedStoredCity]);

  const categoryCounts = useMemo(() => {
    const counts = {} as Record<CategoryFilter, number>;
    for (const category of CATEGORY_FILTERS) {
      counts[category] = requests.filter((request) =>
        requestMatchesCategory(request, category),
      ).length;
    }
    return counts;
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return requests.filter((request) => {
      const requestMonths = deriveMonthsFromDateLabel(request.dateRangeLabel);
      const matchesQuery = !normalizedQuery || getQueryText(request).includes(normalizedQuery);
      const matchesCategory =
        activeCategories.length === 0 ||
        activeCategories.some((category) => requestMatchesCategory(request, category));
      const matchesCity =
        activeCity == null ||
        deriveCityFromDestination(request.destinationLabel) === activeCity;
      const matchesWhen = (() => {
        if (activeWhen) {
          return activeWhen === "flexible"
            ? requestMonths.length === 0
            : getTargetMonths(activeWhen).some((month) => requestMonths.includes(month));
        }

        if (activeDateRange) {
          const rangeMonths = getDateRangeMonths(activeDateRange);
          return rangeMonths.length === 0 || rangeMonths.some((month) => requestMonths.includes(month));
        }

        return true;
      })();

      return matchesQuery && matchesCategory && matchesCity && matchesWhen;
    });
  }, [activeCategories, query, requests, activeCity, activeWhen, activeDateRange]);

  const visibleRequests = useMemo(
    () => filteredRequests.slice(0, visibleCount),
    [filteredRequests, visibleCount]
  );
  const hasMoreRequests = visibleCount < filteredRequests.length;

  useEffect(() => {
    const timer = window.setTimeout(() => setVisibleCount(REQUESTS_PAGE_SIZE), 0);
    return () => window.clearTimeout(timer);
  }, [activeCategories, query, activeCity, activeWhen, activeDateRange]);

  useEffect(() => {
    const loadMoreNode = loadMoreRef.current;
    if (!loadMoreNode || !hasMoreRequests) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisibleCount((current) => Math.min(current + REQUESTS_PAGE_SIZE, filteredRequests.length));
        }
      },
      { rootMargin: "480px 0px" }
    );

    observer.observe(loadMoreNode);
    return () => observer.disconnect();
  }, [filteredRequests.length, hasMoreRequests]);

  const advancedFilterCount =
    (activeCity != null ? 1 : 0) + (activeWhen != null || activeDateRange != null ? 1 : 0);

  const advancedActiveFilters = [
    activeCity
      ? { key: "city", label: activeCity, onRemove: clearCity }
      : null,
    activeWhen
      ? { key: "when", label: getWhenLabel(activeWhen), onRemove: () => setActiveWhen(null) }
      : null,
    activeDateRange
      ? {
          key: "date",
          label: formatDateRangeLabel(activeDateRange),
          onRemove: () => setActiveDateRange(null),
        }
      : null,
  ].filter((entry): entry is { key: string; label: string; onRemove: () => void } => entry !== null);

  function selectCity(city: string): void {
    setActiveCity(city);
    try {
      window.localStorage.setItem("requests-city", city);
    } catch {
      // Best effort only: the selected city still works for the current session.
    }
  }

  function clearCity(): void {
    setActiveCity(null);
    try {
      window.localStorage.removeItem("requests-city");
    } catch {
      // Best effort only: no UI fallback needed if storage removal fails.
    }
  }

  function toggleCategory(category: CategoryFilter): void {
    setActiveCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  }

  function resetDropdownFilters(): void {
    clearCity();
    setActiveWhen(null);
    setActiveDateRange(null);
    setActiveCategories([]);
  }

  return (
    <div>
      <DiscoveryHero imageUrl={brandGradient("requests")} title="Запросы">
        <DiscoverySearchInput
          id="requests-search"
          label="Поиск по запросам"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ключевые слова: город, регион, локация"
        />
      </DiscoveryHero>

      <DiscoveryToolbar
        facets={
          <DiscoveryFacetRail label="Темы запросов">
            <DiscoveryFacetChip
              active={activeCategories.length === 0}
              count={requests.length}
              onClick={() => setActiveCategories([])}
            >
              Все
            </DiscoveryFacetChip>
            {CATEGORY_FILTERS.filter((category) => categoryCounts[category] > 0).map((category) => {
              const pressed = activeCategories.includes(category);
              return (
                <DiscoveryFacetChip
                  key={category}
                  active={pressed}
                  pressed={pressed}
                  count={categoryCounts[category]}
                  onClick={() => toggleCategory(category)}
                >
                  {category}
                </DiscoveryFacetChip>
              );
            })}
          </DiscoveryFacetRail>
        }
        count={
          <DiscoveryResultsCount
            count={filteredRequests.length}
            noun={["запрос", "запроса", "запросов"]}
          />
        }
        actions={
          <DiscoveryFilterSheet
            title="Фильтры"
            description="Уточните город и даты"
            activeCount={advancedFilterCount}
          >
            {(close) => (
              <div className="flex flex-col gap-4 p-3">
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-foreground">Город</p>
                  <Command className="rounded-lg border border-border">
                    <CommandInput placeholder="Куда едете?" />
                    <CommandList>
                      <CommandEmpty>Город не найден</CommandEmpty>
                      <CommandGroup heading="Города">
                        {cityOptions.map((city) => (
                          <CommandItem
                            key={city}
                            value={city}
                            data-checked={city === activeCity}
                            onSelect={() => selectCity(city)}
                          >
                            {city}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-foreground">Когда</p>
                  <ToggleGroup
                    type="single"
                    value={activeWhen ?? ""}
                    // Radix single-toggle emits "" on re-click; keep the preset selected.
                    onValueChange={(next) => {
                      if (!next) return;
                      setActiveWhen(next as WhenPreset);
                      setActiveDateRange(null);
                    }}
                    className="w-full flex-col items-stretch gap-1"
                  >
                    {WHEN_PRESETS.map((option) => (
                      <ToggleGroupItem
                        key={option.value}
                        value={option.value}
                        className={`h-auto w-full cursor-pointer justify-between px-3 py-2 text-left text-sm text-foreground ${TOGGLE_ACTIVE_CLASS}`}
                      >
                        <span>{option.label}</span>
                        {activeWhen === option.value ? (
                          <Check className="size-4" aria-hidden="true" />
                        ) : null}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  <div className="my-1 h-px bg-border" />
                  <div className="px-1 text-sm font-medium text-foreground">Точные даты</div>
                  <Calendar
                    mode="range"
                    locale={ru}
                    selected={
                      activeDateRange?.from
                        ? { from: activeDateRange.from, to: activeDateRange.to }
                        : undefined
                    }
                    onSelect={(range) => {
                      setActiveDateRange(range?.from ? { from: range.from, to: range.to } : null);
                      setActiveWhen(null);
                    }}
                  />
                  <p className="px-1 text-xs leading-[1.5] text-muted-foreground">
                    Сопоставление по месяцам выбранного периода
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={close}
                >
                  Готово
                </Button>
              </div>
            )}
          </DiscoveryFilterSheet>
        }
        activeFilters={
          <DiscoveryActiveFilters filters={advancedActiveFilters} onReset={resetDropdownFilters} />
        }
      />

      <DiscoveryShell>
        {filteredRequests.length > 0 ? (
          <div>
            <DiscoveryGrid>
              {visibleRequests.map((request, index) => {
                const location = request.destinationLabel.split(",")[0].trim();
                const matched = request.status === "matched";
                const sizeCurrent = request.group.sizeCurrent;

                return (
                  <OpenGroupCard
                    key={request.id}
                    href={`/requests/${request.id}`}
                    city={location}
                    region={request.regionLabel}
                    imageUrl={request.cityImageUrl || request.imageUrl || cityImage(location)}
                    status={matched ? "selected" : "waiting"}
                    minPeople={`от ${request.group.sizeTarget} чел.`}
                    date={request.dateRangeLabel}
                    datesFlexible={request.datesFlexible}
                    time={request.timeLabel}
                    interests={request.interests}
                    members={request.members}
                    participantCount={sizeCurrent}
                    owner={request.isOwner}
                    member={request.isMember}
                    price={
                      request.budgetPerPersonRub
                        ? `${formatRubNumber(request.budgetPerPersonRub)} ₽ / чел`
                        : undefined
                    }
                    priority={index < 3}
                  />
                );
                })}
            </DiscoveryGrid>
              {hasMoreRequests ? (
                <div ref={loadMoreRef} className="flex justify-center pt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setVisibleCount((current) => Math.min(current + REQUESTS_PAGE_SIZE, filteredRequests.length))
                    }
                  >
                    Показать ещё
                  </Button>
                </div>
              ) : null}
          </div>
        ) : (
          <EmptyState
            icon={<Compass className="h-10 w-10 text-muted-foreground" />}
            title="Подходящих запросов пока нет"
            description="Попробуйте изменить направление или выбрать другую тематику."
            action={
              <div className="flex gap-3">
                <Button variant="outline" onClick={resetDropdownFilters}>
                  Сбросить фильтры
                </Button>
                <Button asChild>
                  <Link href="/requests/new">Опубликовать запрос</Link>
                </Button>
              </div>
            }
          />
        )}
      </DiscoveryShell>
    </div>
  );
}
