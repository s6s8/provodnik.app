"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";

import type { DestinationRecord } from "@/data/supabase/queries";
import { Input } from "@/components/ui/input";

function toursWord(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "туров";
  if (mod10 === 1) return "тур";
  if (mod10 >= 2 && mod10 <= 4) return "тура";
  return "туров";
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function DestinationsGrid({
  destinations,
}: {
  destinations: DestinationRecord[];
}) {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = normalize(query);
    if (!q) return destinations;
    return destinations.filter((d) => {
      const haystack = `${d.name} ${d.region ?? ""} ${d.description ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [destinations, query]);

  const [featured, ...rest] = filtered;

  return (
    <>
      <div className="mt-8 max-w-xl">
        <label htmlFor="dest-search" className="sr-only">
          Поиск направления
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="dest-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по городу, региону или описанию"
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="mt-8 text-on-surface-muted">
          Ничего не найдено. Попробуйте другой запрос.
        </p>
      )}

      {filtered.length > 0 && (
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr] lg:grid-rows-[280px_280px]">
          {featured && (
            <Link
              href={`/destinations/${featured.slug}`}
              className="relative block overflow-hidden rounded-glass bg-surface-low lg:row-span-2"
            >
              <Image
                src={
                  featured.heroImageUrl ||
                  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=80"
                }
                alt={featured.name}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 767px) 100vw, (max-width: 1023px) 100vw, 560px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(15,23,42,0.78)] to-[rgba(15,23,42,0.06)]" />
              <div className="absolute inset-0 z-[1] flex flex-col justify-end p-6">
                {featured.listingCount ? (
                  <span className="mb-2.5 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.14] px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-[12px]">
                    {featured.listingCount} {toursWord(featured.listingCount)}
                  </span>
                ) : null}
                <p className="font-display text-[1.75rem] font-semibold leading-[1.1] text-white">
                  {featured.name}
                </p>
                <p className="mt-1 text-[0.8125rem] text-white/70">{featured.region}</p>
              </div>
            </Link>
          )}

          {rest.slice(0, 4).map((dest) => (
            <Link
              key={dest.slug}
              href={`/destinations/${dest.slug}`}
              className="relative block overflow-hidden rounded-glass bg-surface-low"
            >
              <Image
                src={
                  dest.heroImageUrl ||
                  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80"
                }
                alt={dest.name}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 320px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(15,23,42,0.78)] to-[rgba(15,23,42,0.06)]" />
              <div className="absolute inset-0 z-[1] flex flex-col justify-end p-6">
                <p className="font-display text-[1.25rem] font-semibold leading-[1.1] text-white">
                  {dest.name}
                </p>
                <p className="mt-1 text-[0.8125rem] text-white/70">{dest.region}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
