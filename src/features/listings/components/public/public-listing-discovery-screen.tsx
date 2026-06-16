"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, Compass, MapPin, Users } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { PublicListing } from "@/data/public-listings/types";
import { getTheme, THEMES, type ThemeSlug } from "@/data/themes";
import { cn, pluralize } from "@/lib/utils";

const fallbackImageUrl =
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=80";

const priceFormatter = new Intl.NumberFormat("ru-RU");

function getDurationLabel(days: number): string {
  return `${days} ${pluralize(days, "день", "дня", "дней")}`;
}

function PublicListingCard({
  listing,
  priority,
}: {
  listing: PublicListing;
  priority: boolean;
}) {
  return (
    <Link
      href={`/listings/${listing.slug}`}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[24px] border border-[var(--outline)] bg-[var(--surface-lowest)] shadow-[var(--card-shadow)] transition duration-200 hover:-translate-y-1 hover:shadow-[var(--lift-shadow)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--primary)]/25"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--surface-low)]">
        <Image
          src={listing.coverImageUrl ?? fallbackImageUrl}
          alt={listing.title}
          fill
          priority={priority}
          fetchPriority={priority ? "high" : "auto"}
          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {listing.themes.map((slug) => {
              const theme = getTheme(slug);
              if (!theme) return null;
              const { Icon, label } = theme;
              return (
                <span
                  key={slug}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-50)] px-3 py-1 text-xs font-semibold text-[var(--primary)]"
                >
                  <Icon className="size-3.5 shrink-0" aria-hidden />
                  {label}
                </span>
              );
            })}
          </div>

          <h2 className="text-[1.35rem] font-semibold leading-[1.12] text-[var(--on-surface)]">
            {listing.title}
          </h2>

          <p className="flex items-center gap-2 text-sm font-medium text-[var(--on-surface-muted)]">
            <MapPin className="size-4 shrink-0 text-[var(--primary)]" aria-hidden />
            <span>
              {listing.city}, {listing.region}
            </span>
          </p>
        </div>

        <p className="line-clamp-2 text-sm leading-6 text-[var(--on-surface-muted)]">
          {listing.highlights.join(". ")}
        </p>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t border-[var(--outline)] pt-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--primary)]">
              Стоимость
            </p>
            <p className="mt-1 text-[1.35rem] font-bold leading-none text-[var(--on-surface)]">
              от {priceFormatter.format(listing.priceFromRub)} ₽
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-semibold text-[var(--on-surface-muted)]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--outline)] bg-white px-3 py-1.5">
              <Clock className="size-3.5 text-[var(--primary)]" aria-hidden />
              {getDurationLabel(listing.durationDays)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--outline)] bg-white px-3 py-1.5">
              <Users className="size-3.5 text-[var(--primary)]" aria-hidden />
              до {listing.groupSizeMax} чел.
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function PublicListingDiscoveryScreen({
  listings,
  initialSearch = "",
}: {
  listings: readonly PublicListing[];
  initialSearch?: string;
}) {
  const [activeFilter, setActiveFilter] = useState<"all" | ThemeSlug>("all");
  const [search, setSearch] = useState(initialSearch);

  const filteredListings = useMemo(() => {
    const themeFiltered =
      activeFilter === "all"
        ? listings
        : listings.filter((listing) => listing.themes.includes(activeFilter));

    const query = search.trim().toLowerCase();
    if (!query) return themeFiltered;

    return themeFiltered.filter((listing) => {
      const haystack = [
        listing.title,
        listing.highlights.join(" "),
        listing.city,
        listing.region,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [activeFilter, listings, search]);

  return (
    <div className="bg-[var(--surface)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="max-w-3xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--primary)]">
            Каталог гидов
          </p>
          <h1 className="text-[clamp(2rem,4.4vw,3.25rem)] font-semibold leading-[1.04] text-[var(--on-surface)]">
            Готовые экскурсии
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[var(--on-surface-muted)] sm:text-lg">
            Выбирайте готовые маршруты от локальных гидов: понятная цена, формат группы и
            длительность уже собраны в карточке.
          </p>
        </section>

        <div className="max-w-[36rem]">
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по названию, описанию или направлению…"
            aria-label="Поиск по экскурсиям"
            className="h-12 rounded-[14px] border-[var(--outline)] bg-[var(--surface-lowest)] text-[var(--on-surface)] shadow-[var(--card-shadow)] placeholder:text-[var(--on-surface-muted)] focus-visible:border-[var(--primary)] focus-visible:ring-[var(--primary)]/20"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            key="all"
            type="button"
            onClick={() => setActiveFilter("all")}
            className={cn(
              "inline-flex h-10 cursor-pointer items-center justify-center rounded-full border px-5 text-[0.9rem] transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--primary)]/20",
              activeFilter === "all"
                ? "border-[var(--brand-50)] bg-[var(--brand-50)] font-semibold text-[var(--primary)]"
                : "border-[var(--outline)] bg-[var(--surface-lowest)] font-medium text-[var(--on-surface-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]",
            )}
          >
            Все
          </button>
          {THEMES.map(({ slug, label, Icon }) => (
            <button
              key={slug}
              type="button"
              onClick={() => setActiveFilter(slug)}
              className={cn(
                "inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border px-5 text-[0.9rem] transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--primary)]/20",
                activeFilter === slug
                  ? "border-[var(--brand-50)] bg-[var(--brand-50)] font-semibold text-[var(--primary)]"
                  : "border-[var(--outline)] bg-[var(--surface-lowest)] font-medium text-[var(--on-surface-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
            </button>
          ))}
        </div>

        {filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredListings.map((listing, index) => (
              <PublicListingCard
                key={listing.slug}
                listing={listing}
                priority={index === 0}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[24px] border border-[var(--outline)] bg-[var(--surface-lowest)] px-6 py-16 text-center shadow-[var(--card-shadow)]">
            <span className="flex size-14 items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--primary)]">
              <Compass className="size-6" strokeWidth={1.9} />
            </span>
            <h2 className="mt-5 text-[1.35rem] font-semibold text-[var(--on-surface)]">
              Маршруты не найдены
            </h2>
            <p className="mt-2 max-w-[30rem] text-[0.95rem] leading-7 text-[var(--on-surface-muted)]">
              Попробуйте другой фильтр или измените поисковый запрос.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-[14px] bg-[var(--primary)] px-6 text-[0.9rem] font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--primary)]/25"
            >
              Создать запрос
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
