import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Search } from "lucide-react";

import { ListHero } from "@/components/shared/list-hero";
import { FilterBar } from "@/components/traveler/FilterBar";
import { ListingGrid } from "@/components/traveler/ListingGrid";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { brandGradient } from "@/lib/city-image";
import { ROUTES } from "@/lib/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ListingRow } from "@/lib/supabase/types";
import { pluralize } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Поиск и направления",
  description: "Экскурсии и активности — фильтры по типу, формату и цене",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const sp = {
    q: firstStr(raw.q),
    region: firstStr(raw.region),
    type: firstStr(raw.type),
    format: firstStr(raw.format),
    min_price: firstStr(raw.min_price),
    max_price: firstStr(raw.max_price),
    sort: normalizeSort(firstStr(raw.sort)),
  };

  let listings: ListingRow[] = [];
  let totalCount = 0;
  let loadError = false;

  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("listings")
      .select(
        "id, slug, title, region, city, exp_type, format, duration_minutes, price_from_minor, currency, average_rating, review_count, image_url, languages, difficulty_level",
        { count: "exact" },
      )
      .eq("status", "published");

    if (sp.q) query = query.ilike("title", `%${sp.q}%`);
    if (sp.region) query = query.eq("region", sp.region);
    if (sp.type) query = query.eq("exp_type", sp.type);
    if (sp.format) query = query.eq("format", sp.format);
    if (sp.min_price) {
      const n = Number(sp.min_price);
      if (!Number.isNaN(n)) query = query.gte("price_from_minor", n * 100);
    }
    if (sp.max_price) {
      const n = Number(sp.max_price);
      if (!Number.isNaN(n)) query = query.lte("price_from_minor", n * 100);
    }

    const sort = sp.sort ?? "featured";
    if (sort === "price_asc") query = query.order("price_from_minor", { ascending: true });
    else if (sort === "price_desc") query = query.order("price_from_minor", { ascending: false });
    else if (sort === "rating") query = query.order("average_rating", { ascending: false });
    else query = query.order("featured_rank", { ascending: true, nullsFirst: false });

    const { data, error, count } = await query.limit(48);
    if (error) {
      const Sentry = await import("@sentry/nextjs");
      Sentry.captureException(error);
      loadError = true;
    }
    listings = (data ?? []) as ListingRow[];
    totalCount = count ?? 0;
  } catch {
    listings = [];
    loadError = true;
  }

  const title =
    sp.q && sp.region ? `«${sp.q}» в ${sp.region}` : "Все предложения";

  return (
    <section className="pb-20">
      <ListHero
        imageUrl={brandGradient("search")}
        title={title}
        intro="Фильтруйте по типу, формату и цене — или опубликуйте запрос, если не нашли."
      >
        {/* Server-rendered search fills the hero's right-side dead space and gives
            the page a text-search affordance the filter pills below don't cover.
            GET to /search preserves the active region/type/format/sort filters. */}
        <form
          action="/search"
          method="get"
          role="search"
          className="flex w-full items-center gap-2 rounded-full border border-white/30 bg-surface/95 p-1.5 pl-4 shadow-lift backdrop-blur-sm"
        >
          {sp.region ? <input type="hidden" name="region" value={sp.region} /> : null}
          {sp.type ? <input type="hidden" name="type" value={sp.type} /> : null}
          {sp.format ? <input type="hidden" name="format" value={sp.format} /> : null}
          {sp.sort ? <input type="hidden" name="sort" value={sp.sort} /> : null}
          <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Город, тип экскурсии или интерес…"
            aria-label="Поиск предложений"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <Button type="submit" className="shrink-0 rounded-full px-5">
            Найти
          </Button>
        </form>
      </ListHero>
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)] pt-10">
        <Suspense fallback={<Skeleton className="mb-8 h-28 w-full rounded-xl" />}>
          <FilterBar
            currentType={sp.type}
            currentFormat={sp.format}
            currentSort={sp.sort}
            currentMinPrice={sp.min_price}
            currentMaxPrice={sp.max_price}
            q={sp.q}
            region={sp.region}
          />
        </Suspense>
        {loadError ? (
          <Alert variant="destructive">
            <AlertDescription>
              Не удалось выполнить поиск. Попробуйте обновить страницу.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {totalCount > 0 ? (
              <p className="mb-4 text-sm text-on-surface-muted">
                Найдено {totalCount}{" "}
                {pluralize(totalCount, "предложение", "предложения", "предложений")}
              </p>
            ) : null}
            <ListingGrid listings={listings} />
            {listings.length === 0 ? (
              <div className="mt-12 flex flex-col items-center gap-3 text-center">
                <p className="text-on-surface-muted">Ничего не нашли по вашему запросу</p>
                <p className="max-w-[420px] text-sm text-on-surface-muted">
                  Опубликуйте запрос — местные гиды предложат варианты под вашу поездку.
                </p>
                <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
                  <Button asChild>
                    <Link href={ROUTES.newRequest.href}>Опубликовать запрос</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/search">Сбросить фильтры</Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

function firstStr(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  const s = Array.isArray(v) ? v[0] : v;
  const t = (s ?? "").trim();
  return t.length > 0 ? t : undefined;
}

const SORT_KEYS = new Set(["featured", "price_asc", "price_desc", "rating"]);

function normalizeSort(v: string | undefined): string | undefined {
  if (!v) return undefined;
  return SORT_KEYS.has(v) ? v : undefined;
}

export const dynamic = "force-dynamic";
