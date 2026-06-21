"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronDown, Compass, X } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ListHero } from "@/components/shared/list-hero";
import { RequestCardFinal } from "@/components/shared/request-card-final";
import { Badge } from "@/components/ui/badge";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { OpenRequestRecord } from "@/data/open-requests/types";
import { THEMES } from "@/data/themes";
import { todayMoscowISODate } from "@/lib/dates";

type CategoryFilter = (typeof THEMES)[number]["label"];

const CATEGORY_FILTERS: CategoryFilter[] = THEMES.map((theme) => theme.label);

const CATEGORY_INTEREST_SLUGS = Object.fromEntries(
  THEMES.map((theme) => [theme.label, theme.slug] as const),
) as Record<CategoryFilter, string>;

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
type WhenPreset = (typeof WHEN_PRESETS)[number]["value"];
type ActiveDateRange = { from?: Date; to?: Date };

type Props = {
  initialData: OpenRequestRecord[] | null;
};

type FilterControlProps = {
  label: string;
  title: string;
  description: string;
  children: (close: () => void) => ReactNode;
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

function derivePrice(budgetPerPersonRub?: number): string {
  if (!budgetPerPersonRub) return "По договоренности";
  return `${new Intl.NumberFormat("ru-RU").format(budgetPerPersonRub)} ₽ / чел`;
}

function deriveGuideState(status: OpenRequestRecord["status"]) {
  return status === "matched" ? "found" : "waiting";
}

function getSearchText(request: OpenRequestRecord): string {
  return request.highlights
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

function FilterControl({ label, title, description, children }: FilterControlProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const trigger = (
    <Button type="button" variant="outline" className="w-full min-w-0 cursor-pointer justify-between">
      <span className="truncate">{label}</span>
      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
    </Button>
  );

  return (
    <>
      <div className="hidden md:block">
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent align="start" className="w-[320px] p-0">
            {children(() => setIsPopoverOpen(false))}
          </PopoverContent>
        </Popover>
      </div>
      <div className="md:hidden">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>{trigger}</SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] rounded-t-card p-0">
            <SheetHeader>
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>{description}</SheetDescription>
            </SheetHeader>
            <div className="overflow-y-auto px-4 pb-4">{children(() => setIsSheetOpen(false))}</div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

export function PublicRequestsMarketplaceScreen({ initialData }: Props) {
  const [query, setQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<CategoryFilter[]>([]);
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [activeWhen, setActiveWhen] = useState<WhenPreset | null>(null);
  const [activeDateRange, setActiveDateRange] = useState<ActiveDateRange | null>(null);
  const [hasLoadedStoredCity, setHasLoadedStoredCity] = useState(false);

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
  }, [cityOptions, hasLoadedStoredCity]);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const categoryMap: Record<CategoryFilter, string[]> = {
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

    return requests.filter((request) => {
      const searchText = getSearchText(request);
      const requestMonths = deriveMonthsFromDateLabel(request.dateRangeLabel);
      const matchesQuery = !normalizedQuery || searchText.includes(normalizedQuery);
      const matchesCategory =
        activeCategories.length === 0 ||
        activeCategories.some((category) => {
          const slug = CATEGORY_INTEREST_SLUGS[category] ?? "";
          return request.interests?.includes(slug) || categoryMap[category].some((token) => searchText.includes(token));
        });
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

  const hasActiveDropdownFilter =
    activeCity != null || activeWhen != null || activeDateRange != null || activeCategories.length > 0;

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
      <ListHero
        imageUrl="https://images.unsplash.com/photo-1657293493705-557ab000afe1?auto=format&fit=crop&w=1600&h=1200&q=80"
        title="Открытые запросы"
        intro="Гиды — выбирайте запросы и предлагайте тур. Путешественники — присоединяйтесь к сборным группам."
      >
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="requests-search" className="sr-only">
              Поиск по запросам
            </label>
            <input
              id="requests-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ключевые слова: формат, детали, пожелания"
              className="h-12 w-full rounded-full border border-border bg-surface-high px-5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
          <div>
            <Button asChild>
              <Link href="/requests/new">Опубликовать запрос</Link>
            </Button>
          </div>
        </div>
      </ListHero>

      <section className="bg-surface-low py-8">
        <div className="mx-auto flex w-full max-w-page flex-col gap-4 px-[clamp(20px,4vw,48px)]">
          <div className="mx-auto grid grid-cols-2 gap-2 sm:grid-cols-3 md:max-w-[560px] md:gap-3">
            <FilterControl
              label="Город"
              title="Город"
              description="Найдите город в текущих запросах"
            >
              {(close) => (
                <Command>
                  <CommandInput placeholder="Куда едете?" />
                  <CommandList>
                    <CommandEmpty>Город не найден</CommandEmpty>
                    <CommandGroup heading="Города">
                      {cityOptions.map((city) => (
                        <CommandItem
                          key={city}
                          value={city}
                          data-checked={city === activeCity}
                          onSelect={() => {
                            selectCity(city);
                            close();
                          }}
                        >
                          {city}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              )}
            </FilterControl>

            <FilterControl
              label="Когда"
              title="Когда"
              description="Выберите один временной пресет"
            >
              {(close) => (
                <div className="flex flex-col gap-2 p-1">
                  {WHEN_PRESETS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={activeWhen === option.value}
                      onClick={() => {
                        setActiveWhen(option.value);
                        setActiveDateRange(null);
                        close();
                      }}
                      className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        activeWhen === option.value
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <span>{option.label}</span>
                      {activeWhen === option.value && <span aria-hidden="true">✓</span>}
                    </button>
                  ))}
                  <div className="my-2 h-px bg-border" />
                  <div className="px-3 pt-1 text-sm font-medium text-foreground">Точные даты</div>
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
                  <p className="px-3 pb-2 text-xs leading-[1.5] text-muted-foreground">
                    Сопоставление по месяцам выбранного периода
                  </p>
                </div>
              )}
            </FilterControl>

            <FilterControl
              label={activeCategories.length ? `Тема · ${activeCategories.length}` : "Тема"}
              title="Тема"
              description="Можно выбрать несколько тем"
            >
              {(close) => (
                <div className="flex flex-col gap-2 p-1">
                  {CATEGORY_FILTERS.map((category) => (
                    <label
                      key={category}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        checked={activeCategories.includes(category)}
                        onChange={() => toggleCategory(category)}
                        className="size-4 rounded border-border accent-primary"
                      />
                      <span>{category}</span>
                    </label>
                  ))}
                  <Button type="button" variant="outline" size="sm" className="mt-2 cursor-pointer" onClick={close}>
                    Готово
                  </Button>
                </div>
              )}
            </FilterControl>
          </div>

          {hasActiveDropdownFilter && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {activeCity && (
                <Badge variant="outline" className="normal-case tracking-normal">
                  {activeCity}
                  <button
                    type="button"
                    onClick={clearCity}
                    className="cursor-pointer text-muted-foreground hover:text-foreground"
                    aria-label={`Очистить город ${activeCity}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {activeWhen && (
                <Badge variant="outline" className="normal-case tracking-normal">
                  {getWhenLabel(activeWhen)}
                  <button
                    type="button"
                    onClick={() => setActiveWhen(null)}
                    className="cursor-pointer text-muted-foreground hover:text-foreground"
                    aria-label={`Очистить период ${getWhenLabel(activeWhen)}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {activeDateRange && (
                <Badge variant="outline" className="normal-case tracking-normal">
                  {formatDateRangeLabel(activeDateRange)}
                  <button
                    type="button"
                    onClick={() => setActiveDateRange(null)}
                    className="cursor-pointer text-muted-foreground hover:text-foreground"
                    aria-label={`Очистить период ${formatDateRangeLabel(activeDateRange)}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {activeCategories.map((category) => (
                <Badge key={category} variant="outline" className="normal-case tracking-normal">
                  {category}
                  <button
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className="cursor-pointer text-muted-foreground hover:text-foreground"
                    aria-label={`Очистить тему ${category}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <button
                type="button"
                onClick={resetDropdownFilters}
                className="cursor-pointer px-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                Сбросить всё
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="py-sec-pad">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
          {filteredRequests.length > 0 ? (
            <div className="mx-auto max-w-2xl">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredRequests.map((request) => {
                const location = request.destinationLabel.split(",")[0].trim();

                return (
                  <RequestCardFinal
                    key={request.id}
                    href={`/requests/${request.id}`}
                    location={location}
                    date={request.dateRangeLabel}
                    time={request.timeLabel}
                    groupType={request.group.openToMoreMembers ? "assembly" : "private"}
                    datesFlexible={request.datesFlexible}
                    guideState={deriveGuideState(request.status)}
                    interests={request.interests}
                    members={request.members}
                    participantCount={request.group.sizeCurrent}
                    price={derivePrice(request.budgetPerPersonRub)}
                    groupPrice={request.budgetPerPersonRub != null
                      ? `~${new Intl.NumberFormat('ru-RU').format(Math.round(request.budgetPerPersonRub * request.group.sizeCurrent))} ₽ за группу`
                      : undefined}
                  />
                );
              })}
            </div>
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
        </div>
      </section>
    </div>
  );
}
