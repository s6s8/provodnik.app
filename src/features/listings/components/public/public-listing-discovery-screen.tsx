"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { MapPinned, SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PublicListing } from "@/data/public-listings/types";
import { PublicListingCard } from "@/features/listings/components/public/public-listing-card";
import { PublicListingFilters } from "@/features/listings/components/public/public-listing-filters";

export function PublicListingDiscoveryScreen({
  listings,
}: {
  listings: readonly PublicListing[];
}) {
  const [filtered, setFiltered] = useState<readonly PublicListing[]>(listings);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => a.priceFromRub - b.priceFromRub),
    [filtered],
  );

  return (
    <div className="space-y-8">
      <section className="section-frame overflow-hidden rounded-[2.4rem] p-6 sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <MapPinned className="size-4 text-primary" />
              Каталог экскурсий
            </div>
            <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Подберите экскурсию по городу, длительности и формату группы.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground">
              В карточке сразу видно цену, размер группы, рейтинг и как быстро гид
              отвечает на новые заявки. Это ближе к реальному бронированию, чем к
              длинной статье о маршруте.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-full bg-primary/10 px-3 py-1.5 text-primary hover:bg-primary/10">
                Ростов и юг России
              </Badge>
              <Badge className="rounded-full bg-primary/10 px-3 py-1.5 text-primary hover:bg-primary/10">
                Байкал и сезонные поездки
              </Badge>
              <Badge className="rounded-full bg-primary/10 px-3 py-1.5 text-primary hover:bg-primary/10">
                Семьи, пары и компании
              </Badge>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="sm" className="rounded-full">
                <Link href="/traveler">Оставить запрос под ваши даты</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <Link href="/requests">Смотреть открытые запросы</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[1.8rem] border border-border/70 bg-white/78 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Сейчас в каталоге
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {listings.length}
              </p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Готовых маршрутов для запуска витрины и теста бронирования.
              </p>
            </div>
            <div className="rounded-[1.8rem] border border-border/70 bg-white/78 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Что важно
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                Цена, отзыв, темп и понятный план дня
              </p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Мы делаем упор на понятные карточки маршрутов, а не на длинный
                рекламный текст.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <SlidersHorizontal className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Фильтры витрины</p>
            <p className="text-sm text-muted-foreground">
              Сузьте выдачу по региону, длительности и формату.
            </p>
          </div>
        </div>

        <PublicListingFilters listings={listings} onFilteredListingsChange={setFiltered} />
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Найдено маршрутов</p>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              {sorted.length}
            </h2>
          </div>
          <div className="rounded-full border border-border/70 bg-white/74 px-4 py-2 text-sm text-muted-foreground">
            Сортировка: сначала самые доступные по цене
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {sorted.map((listing) => (
            <PublicListingCard key={listing.slug} listing={listing} />
          ))}
        </div>
      </section>

      <section className="section-frame rounded-[2rem] border border-border/70 bg-card/80 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Если не нашли подходящий маршрут
            </p>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
              Provodnik строит витрину вокруг запросов. Можно сразу{" "}
              <Link href="/traveler" className="underline underline-offset-4">
                оставить заявку под ваши даты и город
              </Link>{" "}
              или{" "}
              <Link href="/requests" className="underline underline-offset-4">
                посмотреть открытые запросы и примеры поездок
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" className="rounded-full">
              <Link href="/traveler">Оставить запрос</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <Link href="/requests">Смотреть запросы</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
