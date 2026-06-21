import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ListHero } from "@/components/shared/list-hero";
import { FilterBar } from "@/components/traveler/FilterBar";
import { ListingGrid } from "@/components/traveler/ListingGrid";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ListingRow } from "@/lib/supabase/types";

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

  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("listings")
      .select(
        "id, slug, title, region, city, exp_type, format, duration_minutes, price_from_minor, currency, average_rating, review_count, image_url, languages, difficulty_level",
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

    const { data, error } = await query.limit(48);
    if (error) {
      const Sentry = await import("@sentry/nextjs");
      Sentry.captureException(error);
    }
    listings = (data ?? []) as ListingRow[];
  } catch {
    listings = [];
  }

  const title =
    sp.q && sp.region ? `«${sp.q}» в ${sp.region}` : "Все предложения";

  return (
    <section className="pb-20">
      <ListHero
        imageUrl="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&h=1200&q=80"
        title={title}
        intro="Фильтруйте по типу, формату и цене — или опубликуйте запрос, если не нашли."
      />
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
        <ListingGrid listings={listings} />
        {listings.length === 0 ? (
          <div className="mt-12 flex flex-col items-center gap-3 text-center">
            <p className="text-on-surface-muted">Ничего не нашли по вашему запросу</p>
            <p className="max-w-[420px] text-sm text-on-surface-muted">
              Опубликуйте запрос — местные гиды предложат варианты под вашу поездку.
            </p>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
              <Button asChild>
                <Link href="/">Опубликовать запрос</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/search">Сбросить фильтры</Link>
              </Button>
            </div>
          </div>
        ) : null}
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
