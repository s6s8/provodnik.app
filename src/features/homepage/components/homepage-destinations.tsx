import Image from "next/image";
import Link from "next/link";

import type { DestinationRecord } from "@/data/supabase/queries";

interface Props {
  destinations: DestinationRecord[];
}

export function HomePageDestinations({ destinations }: Props) {
  if (destinations.length === 0) return null;

  const [featured, ...rest] = destinations;

  return (
    <section className="py-sec-pad" aria-labelledby="dest-title">
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Популярные направления
            </p>
            <h2
              id="dest-title"
              className="font-display text-[clamp(1.875rem,3.5vw,2.375rem)] font-semibold leading-[1.1]"
            >
              Российские маршруты, которые собирают группы быстрее всего
            </h2>
          </div>
          <Link href="/destinations" className="whitespace-nowrap font-sans text-sm font-semibold text-primary">
            Все направления →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-[1.35fr_1fr_1fr] md:grid-rows-[226px_226px]">
          {featured ? (
            <Link
              href={`/destinations/${featured.slug}`}
              className="relative block overflow-hidden rounded-glass transition-transform duration-200 hover:-translate-y-[3px] md:row-span-2 max-md:min-h-[280px]"
            >
              <Image
                src={featured.heroImageUrl}
                alt=""
                fill
                sizes="(min-width: 1024px) 39vw, (min-width: 768px) 50vw, 100vw"
                className="absolute inset-0 block h-full w-full object-cover"
              />
              <div
                className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[rgba(15,23,42,0.78)] to-[rgba(15,23,42,0.06)]"
                aria-hidden="true"
              />
              <div className="absolute inset-x-0 bottom-0 z-[1] p-7 text-white">
                <h3 className="mb-2.5 font-display text-[2.375rem] font-semibold leading-none">
                  {featured.name}
                </h3>
                <p className="mb-[18px] max-w-[28ch] text-[0.8125rem] leading-[1.55] text-white/[0.76]">
                  {featured.description}
                </p>
                <span className="inline-flex items-center rounded-full bg-primary px-5 py-2 font-sans text-[0.8125rem] font-semibold text-white">
                  Смотреть туры
                </span>
              </div>
            </Link>
          ) : null}

          {rest.slice(0, 4).map((dest) => (
            <Link
              key={dest.slug}
              href={`/destinations/${dest.slug}`}
              className="relative block overflow-hidden rounded-glass transition-transform duration-200 hover:-translate-y-[3px]"
            >
              <Image
                src={dest.heroImageUrl}
                alt=""
                fill
                sizes="(min-width: 1024px) 29vw, (min-width: 768px) 50vw, 100vw"
                className="absolute inset-0 block h-full w-full object-cover"
              />
              <div
                className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[rgba(15,23,42,0.78)] to-[rgba(15,23,42,0.06)]"
                aria-hidden="true"
              />
              <div className="absolute inset-x-0 bottom-0 z-[1] flex items-end justify-between gap-3 px-[22px] py-[18px] text-white">
                <h3 className="font-sans text-[1.125rem] font-semibold leading-[1.15]">
                  {dest.name}
                </h3>
                <span className="whitespace-nowrap text-xs font-medium text-white/75">
                  {dest.listingCount} туров
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
