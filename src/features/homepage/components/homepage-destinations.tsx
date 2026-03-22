import Image from "next/image";
import Link from "next/link";

import {
  type HomeDestination,
  homeContainerClass,
  homepageContent,
} from "@/features/homepage/components/homepage-content";
import { cn } from "@/lib/utils";

export function HomePageDestinations() {
  const featured = homepageContent.destinations.cards.find((card) => card.featured);
  const secondaryCards = homepageContent.destinations.cards.filter(
    (card) => !card.featured,
  );

  return (
    <section className={cn(homeContainerClass, "pb-10 pt-4 sm:pt-6")}>
      <div className="space-y-5">
        <h2 className="text-[1.75rem] font-semibold tracking-tight text-[var(--color-text)] sm:text-[1.875rem]">
          {homepageContent.destinations.title}
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr] lg:grid-rows-2 lg:gap-3">
          {featured ? (
            <DestinationCard
              card={featured}
              className="min-h-[380px] sm:col-span-2 sm:min-h-[400px] lg:col-span-1 lg:row-span-2 lg:min-h-[420px]"
              contentClassName="max-w-[22rem]"
            />
          ) : null}

          {secondaryCards.map((card) => (
            <DestinationCard
              key={card.name}
              card={card}
              className="min-h-[188px] lg:min-h-[200px]"
              contentClassName="max-w-[11rem]"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function DestinationCard({
  card,
  className,
  contentClassName,
}: {
  card: HomeDestination;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Link
      href={card.href}
      className={cn(
        "group relative overflow-hidden rounded-[24px] border border-white/60 shadow-[0_22px_60px_rgba(33,49,63,0.11)] ring-1 ring-black/[0.03] transition-shadow duration-300 hover:shadow-[0_28px_72px_rgba(33,49,63,0.14)]",
        card.featured && "rounded-[26px]",
        className,
      )}
    >
      <Image
        src={card.imageUrl}
        alt={card.name}
        fill
        sizes={
          card.featured
            ? "(max-width: 1024px) 100vw, 520px"
            : "(max-width: 1024px) 50vw, 280px"
        }
        className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
      />
      <div
        className={cn(
          "absolute inset-0",
          card.featured
            ? "bg-[linear-gradient(180deg,rgba(15,23,42,0.02)_0%,transparent_42%,rgba(15,23,42,0.88)_100%)]"
            : "bg-[linear-gradient(180deg,rgba(15,23,42,0.08)_0%,rgba(15,23,42,0.72)_100%)]",
        )}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_12%,rgba(255,255,255,0.22),transparent_38%)]" />

      {card.badge ? (
        <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-[rgba(217,119,6,0.92)] px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-white shadow-sm">
          {card.badge}
        </span>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">
        <div
          className={cn(
            contentClassName,
            card.featured
              ? "rounded-2xl border border-white/25 bg-[rgba(255,255,255,0.14)] px-3 py-2.5 shadow-[0_12px_40px_rgba(15,23,42,0.12)] backdrop-blur-md backdrop-saturate-150"
              : "space-y-1",
          )}
        >
          <p
            className={cn(
              "font-semibold leading-tight text-white",
              card.featured
                ? "font-display text-[1.625rem] sm:text-[1.75rem] drop-shadow-sm"
                : "text-[0.9375rem] drop-shadow-sm",
            )}
          >
            {card.name}
          </p>
          <p
            className={cn(
              "text-[0.75rem] text-white/85",
              !card.featured && "drop-shadow-sm",
            )}
          >
            {card.subtitle}
          </p>
          {card.ctaLabel ? (
            <span className="mt-3 inline-flex h-9 items-center justify-center rounded-full bg-[var(--color-primary)] px-5 text-[0.8125rem] font-semibold text-white shadow-[0_8px_24px_rgba(15,118,110,0.28)] transition-[transform,box-shadow] duration-200 group-hover:-translate-y-px group-hover:shadow-[0_12px_28px_rgba(15,118,110,0.32)]">
              {card.ctaLabel}
            </span>
          ) : null}
        </div>

        {!card.featured && (
          <p className="mb-1 shrink-0 self-end text-right text-[0.6875rem] font-medium text-white/88 drop-shadow-sm">
            {card.toursLabel}
          </p>
        )}
      </div>
    </Link>
  );
}
