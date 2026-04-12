import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

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

    const { data } = await query.limit(48);
    listings = (data ?? []) as ListingRow[];
  } catch {
    listings = [];
  }

  const title =
    sp.q && sp.region ? `«${sp.q}» в ${sp.region}` : "Все предложения";

  return (
    <section className="pb-20 pt-10">
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
        <h1 className="mb-8 font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          {title}
        </h1>
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
          <div className="mt-12 flex flex-col items-center gap-4 text-center">
            <p className="text-muted-foreground">Ничего не найдено по вашему запросу</p>
            <Button asChild variant="secondary">
              <Link href="/search">Сбросить фильтры</Link>
            </Button>
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
