import Image from "next/image";
import Link from "next/link";
import { Manrope } from "next/font/google";
import { ArrowUpRight, Search, Star } from "lucide-react";

import { seededPublicGuides } from "@/data/public-guides/seed";
import type { PublicGuideProfile } from "@/data/public-guides/types";
import { seededPublicListings } from "@/data/public-listings/seed";
import type { PublicListing } from "@/data/public-listings/types";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-homepage-sans",
});

const HERO_LISTING_SLUG = "spb-white-nights-editorial";
const HOMEPAGE_LISTING_SLUGS = [
  "spb-white-nights-editorial",
  "kazan-evening-taste-walk",
  "kaliningrad-dunes-courtyards",
  "suzdal-morning-bells",
  "murmansk-northern-coast",
] as const;

const NAV_ITEMS = [
  { href: "/listings", label: "Направления" },
  { href: "/listings", label: "Впечатления" },
  { href: "/trust", label: "О сервисе" },
  { href: "/auth", label: "Профиль" },
] as const;

type HomeCard = {
  listing: PublicListing;
  guide: PublicGuideProfile;
};

function getHomeCards(): HomeCard[] {
  return HOMEPAGE_LISTING_SLUGS.map((slug) => {
    const listing = seededPublicListings.find((item) => item.slug === slug);
    if (!listing) {
      throw new Error(`Homepage listing not found: ${slug}`);
    }

    const guide = seededPublicGuides.find((item) => item.slug === listing.guideSlug);
    if (!guide) {
      throw new Error(`Homepage guide not found: ${listing.guideSlug}`);
    }

    return { listing, guide };
  });
}

function formatRub(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function getGuideInitials(guide: PublicGuideProfile) {
  if (guide.avatarInitials) {
    return guide.avatarInitials;
  }

  return guide.displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function HomePageShell() {
  const cards = getHomeCards();
  const heroCard = cards.find((card) => card.listing.slug === HERO_LISTING_SLUG) ?? cards[0];

  return (
    <div className={`${manrope.variable} bg-[#0f0f0f] text-white [font-family:var(--font-homepage-sans)]`}>
      <section className="relative min-h-[52vh] overflow-hidden bg-[#0f0f0f] sm:min-h-[54vh] lg:min-h-[56vh]">
        <Image
          src={heroCard.listing.coverImageUrl ?? "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2200&h=1400&q=80"}
          alt={heroCard.listing.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(15,15,15,0.92)_0%,rgba(15,15,15,0.5)_50%,rgba(15,15,15,0.18)_82%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_26%)]" />

        <div className="relative mx-auto flex min-h-[52vh] w-full max-w-[1400px] flex-col px-4 pb-6 pt-4 sm:min-h-[54vh] sm:px-6 lg:min-h-[56vh] lg:px-8">
          <nav className="flex flex-wrap justify-center gap-2 md:justify-end" aria-label="Homepage navigation">
            {NAV_ITEMS.map((item, index) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={`rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-md transition hover:bg-white/18 hover:text-white ${index === 0 ? "border-white/22 bg-white/18 text-white" : "border-white/12 bg-white/10 text-white/82"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mx-auto flex max-w-[760px] flex-1 flex-col items-center justify-center text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.26em] text-white/60 sm:mb-5">
              Маршруты с локальными проводниками
            </p>
            <h1 className="max-w-[720px] text-balance text-[2rem] font-semibold leading-[1.05] tracking-[-0.04em] [text-shadow:0_2px_12px_rgba(0,0,0,0.4)] sm:text-[2.6rem] lg:text-[3.5rem]">
              Открывайте живые маршруты по России с местными проводниками
            </h1>

            <form
              action="/listings"
              className="mt-4 flex w-full max-w-[480px] items-center rounded-full border border-white/10 bg-white/10 p-1.5 pl-4 backdrop-blur-md sm:mt-5"
            >
              <Search className="size-5 shrink-0 text-white/50" />
              <input
                type="text"
                name="q"
                aria-label="Поиск маршрута"
                placeholder="Куда отправимся?"
                className="h-11 flex-1 bg-transparent px-3 text-[15px] text-white outline-none placeholder:text-white/50"
              />
              <button
                type="submit"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#3B82F6] text-white transition hover:scale-105 hover:bg-[#60A5FA]"
                aria-label="Открыть каталог"
              >
                <ArrowUpRight className="size-5" />
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="relative -mt-8 bg-[#0f0f0f] pb-8 sm:-mt-12 sm:pb-10 lg:-mt-16 lg:pb-12">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:auto-rows-[280px] lg:grid-flow-dense lg:grid-cols-3 lg:auto-rows-[300px] lg:gap-4">
            <ExperienceCard card={cards[0]} className="min-h-[420px] md:row-span-2 lg:min-h-0" priority />
            <ExperienceCard card={cards[1]} className="min-h-[280px]" />
            <ExperienceCard card={cards[2]} className="min-h-[280px]" minimal />
            <ExperienceCard card={cards[3]} className="min-h-[280px]" />
            <ExperienceCard card={cards[4]} className="min-h-[280px]" />
          </div>
        </div>
      </section>
    </div>
  );
}

function ExperienceCard({
  card,
  className,
  priority = false,
  minimal = false,
}: {
  card: HomeCard;
  className?: string;
  priority?: boolean;
  minimal?: boolean;
}) {
  return (
    <Link
      href={`/listings/${card.listing.slug}`}
      className={`group relative overflow-hidden rounded-[20px] bg-black ${className ?? ""}`}
    >
      <Image
        src={card.listing.coverImageUrl ?? "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&h=1000&q=80"}
        alt={card.listing.title}
        fill
        priority={priority}
        sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.82)_0%,rgba(0,0,0,0.28)_55%,rgba(0,0,0,0.08)_100%)] transition group-hover:bg-[linear-gradient(to_top,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.36)_55%,rgba(0,0,0,0.12)_100%)]" />

      {!minimal ? (
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <GuideAvatar guide={card.guide} />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold text-white">{card.guide.displayName}</p>
              <p className="truncate text-xs text-white/70">{card.listing.city}, Россия</p>
              <p className="mt-2 text-sm font-semibold text-white">{card.listing.title}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/75">
                <div className="flex items-center gap-0.5 text-[#FACC15]">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="size-3 fill-current" />
                  ))}
                </div>
                <span className="font-semibold text-white/82">
                  {card.guide.reviewsSummary.averageRating.toFixed(1)}
                </span>
                <span className="text-white/60">({card.guide.reviewsSummary.totalReviews})</span>
              </div>
              <p className="mt-1 text-xs text-white/80">От {formatRub(card.listing.priceFromRub)} ₽ / человек</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
          <div className="max-w-[220px]">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/58">{card.listing.city}</p>
            <p className="mt-2 text-base font-semibold text-white">{card.listing.title}</p>
          </div>
        </div>
      )}
    </Link>
  );
}

function GuideAvatar({ guide }: { guide: PublicGuideProfile }) {
  if (guide.avatarImageUrl) {
    return (
      <div className="relative size-12 shrink-0 overflow-hidden rounded-full border-2 border-white/60 bg-white/10">
        <Image src={guide.avatarImageUrl} alt={guide.displayName} fill sizes="48px" className="object-cover" />
      </div>
    );
  }

  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-white/60 bg-white/18 text-sm font-bold text-white backdrop-blur-sm">
      {getGuideInitials(guide)}
    </div>
  );
}
