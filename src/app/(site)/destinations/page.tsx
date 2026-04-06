import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { getDestinations, type DestinationRecord } from "@/data/supabase/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function toursWord(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "туров";
  if (mod10 === 1) return "тур";
  if (mod10 >= 2 && mod10 <= 4) return "тура";
  return "туров";
}

export function generateMetadata(): Metadata {
  return {
    title: "Направления",
    description: "Откройте лучшие направления для путешествий по России",
  };
}

export default async function DestinationsPage() {
  let destinations: DestinationRecord[] = [];

  const supabase = await createSupabaseServerClient();
  const result = await getDestinations(supabase);
  if (result.data) destinations = result.data;

  const [featured, ...rest] = destinations;

  return (
    <>
      <section className="bg-surface pt-24 pb-20">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
          <p className="font-sans text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground mb-2">Направления</p>
          <h1 className="font-display text-[clamp(2.25rem,5vw,3.625rem)] font-semibold leading-[1.05] text-on-surface mt-2 mb-3">
            Куда поедем?
          </h1>
          <p className="max-w-[46rem] text-base leading-[1.65] text-on-surface-muted">
            Города и регионы России с проверенными маршрутами и локальными гидами.
          </p>

          {destinations.length === 0 && (
            <p className="mt-8 text-on-surface-muted">Пока нет доступных направлений.</p>
          )}

          {destinations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr] lg:grid-rows-[280px_280px] gap-4 mt-12">
              {featured && (
                <Link
                  href={`/destinations/${featured.slug}`}
                  className="relative rounded-glass overflow-hidden block bg-surface-low lg:row-span-2"
                >
                  <Image
                    src={featured.heroImageUrl || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=80"}
                    alt={featured.name}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 767px) 100vw, (max-width: 1023px) 100vw, 560px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(15,23,42,0.78)] to-[rgba(15,23,42,0.06)]" />
                  <div className="absolute inset-0 flex flex-col justify-end p-6 z-[1]">
                    {featured.listingCount ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.14] backdrop-blur-[12px] border border-white/20 text-xs font-medium text-white/90 mb-2.5 w-fit">
                        {featured.listingCount} {toursWord(featured.listingCount)}
                      </span>
                    ) : null}
                    <p className="font-display text-[1.75rem] font-semibold text-white leading-[1.1]">{featured.name}</p>
                    <p className="text-[0.8125rem] text-white/70 mt-1">{featured.region}</p>
                  </div>
                </Link>
              )}

              {rest.slice(0, 4).map((dest) => (
                <Link
                  key={dest.slug}
                  href={`/destinations/${dest.slug}`}
                  className="relative rounded-glass overflow-hidden block bg-surface-low"
                >
                  <Image
                    src={dest.heroImageUrl || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80"}
                    alt={dest.name}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 320px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(15,23,42,0.78)] to-[rgba(15,23,42,0.06)]" />
                  <div className="absolute inset-0 flex flex-col justify-end p-6 z-[1]">
                    <p className="font-display text-[1.25rem] font-semibold text-white leading-[1.1]">{dest.name}</p>
                    <p className="text-[0.8125rem] text-white/70 mt-1">{dest.region}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
