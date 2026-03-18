import Image from "next/image";
import Link from "next/link";
import { Manrope } from "next/font/google";
import { ArrowUpRight, Search, Star } from "lucide-react";

import type { OpenRequestRecord } from "@/data/open-requests/types";
import { getSeededOpenRequests } from "@/data/open-requests/seed";
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

function getOpenGroupsPreview(): OpenRequestRecord[] {
  return getSeededOpenRequests()
    .filter(
      (item) =>
        item.visibility === "public" &&
        (item.status === "open" || item.status === "forming_group") &&
        item.group.openToMoreMembers,
    )
    .slice(0, 3);
}

function getPopularDestinations(limit = 6): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const listing of seededPublicListings) {
    if (!listing.city) continue;
    if (seen.has(listing.city)) continue;
    seen.add(listing.city);
    result.push(listing.city);
    if (result.length >= limit) break;
  }

  return result;
}

export function HomePageShell() {
  const cards = getHomeCards();
  const heroCard =
    cards.find((card) => card.listing.slug === HERO_LISTING_SLUG) ?? cards[0];

  return (
    <div
      className={`${manrope.variable} bg-[#0f0f0f] text-white [font-family:var(--font-homepage-sans)]`}
    >
      <section className="relative min-h-[52vh] overflow-hidden bg-[#0f0f0f] sm:min-h-[54vh] lg:min-h-[56vh]">
        <Image
          src={
            heroCard.listing.coverImageUrl ??
            "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2200&h=1400&q=80"
          }
          alt={heroCard.listing.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(15,15,15,0.92)_0%,rgba(15,15,15,0.5)_50%,rgba(15,15,15,0.18)_82%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_26%)]" />

        <div className="relative mx-auto flex min-h-[52vh] w-full max-w-[1400px] flex-col px-4 pb-6 pt-4 sm:min-h-[54vh] sm:px-6 lg:min-h-[56vh] lg:px-8">
          <nav
            className="flex flex-wrap justify-center gap-2 md:justify-end"
            aria-label="Homepage navigation"
          >
            {NAV_ITEMS.map((item, index) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={`rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-md transition hover:bg-white/18 hover:text-white ${
                  index === 0
                    ? "border-white/22 bg-white/18 text-white"
                    : "border-white/12 bg-white/10 text-white/82"
                }`}
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

      <section className="bg-[#0f0f0f] pb-6 pt-4 sm:pb-8 sm:pt-5 lg:pb-10 lg:pt-6">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-3 md:grid-cols-3">
            <CtaCard
              href="/requests"
              title="Найти группу"
              description="Посмотрите открытые запросы и присоединитесь к поездке, которая совпадает по темпу и бюджету."
              badge="Для тех, кто хочет компанию"
            />
            <CtaCard
              href="/requests/new"
              title="Создать запрос"
              description="Опишите даты, направление и формат — запрос станет точкой входа в маркетплейс по спросу."
              badge="Если нет готового маршрута"
            />
            <CtaCard
              href="/listings"
              title="Исследовать направления"
              description="Полистайте готовые маршруты по городам России с понятными условиями и атмосферой."
              badge="Маршруты от локальных проводников"
            />
          </div>
        </div>
      </section>

      <section className="relative -mt-4 bg-[#0f0f0f] pb-8 sm:-mt-8 sm:pb-10 lg:-mt-12 lg:pb-12">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:auto-rows-[280px] lg:grid-flow-dense lg:grid-cols-3 lg:auto-rows-[300px] lg:gap-4">
            <ExperienceCard
              card={cards[0]}
              className="min-h-[420px] md:row-span-2 lg:min-h-0"
              priority
            />
            <ExperienceCard card={cards[1]} className="min-h-[280px]" />
            <ExperienceCard card={cards[2]} className="min-h-[280px]" minimal />
            <ExperienceCard card={cards[3]} className="min-h-[280px]" />
            <ExperienceCard card={cards[4]} className="min-h-[280px]" />
          </div>
        </div>
      </section>

      <section className="bg-[#050505] pb-10 pt-2 sm:pb-12 sm:pt-4 lg:pb-16 lg:pt-6">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <OpenGroupsSection />
            <PopularDestinationsSection />
          </div>
        </div>
      </section>
    </div>
  );
}

function CtaCard({
  href,
  title,
  description,
  badge,
}: {
  href: string;
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between rounded-3xl border border-white/12 bg-white/6 p-4 text-left backdrop-blur-md transition hover:border-white/26 hover:bg-white/12 sm:p-5"
    >
      <div className="space-y-3">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-white/70">
          <span className="inline-block size-1.5 rounded-full bg-[#3B82F6]" />
          {badge}
        </p>
        <h2 className="text-[1.1rem] font-semibold tracking-tight text-white sm:text-[1.2rem]">
          {title}
        </h2>
        <p className="text-xs leading-relaxed text-white/70 sm:text-sm">
          {description}
        </p>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs font-medium text-white/80">
        <span>Перейти</span>
        <span className="flex items-center gap-1 text-[11px] text-white/70">
          <span className="transition group-hover:translate-x-0.5 group-hover:text-white">
            Открыть
          </span>
          <ArrowUpRight className="size-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  );
}

function OpenGroupsSection() {
  const openGroups = getOpenGroupsPreview();
  if (openGroups.length === 0) return null;

  return (
    <div className="space-y-4 rounded-3xl border border-white/12 bg-white/4 p-4 text-white sm:p-5 lg:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
            Открытые группы
          </p>
          <h2 className="mt-1 text-[1.1rem] font-semibold tracking-tight sm:text-[1.2rem]">
            Присоединяйтесь к уже собирающимся поездкам
          </h2>
        </div>
        <Link
          href="/requests"
          className="hidden rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-white/80 transition hover:border-white hover:bg-white/10 sm:inline-flex"
        >
          Все запросы
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {openGroups.map((request) => (
          <Link
            key={request.id}
            href="/requests"
            className="group flex flex-col gap-2 rounded-2xl border border-white/12 bg-black/30 p-3 text-xs transition hover:border-white/30 hover:bg-black/50 sm:p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/60">
                  {request.destinationLabel}
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  Группа под запрос
                </p>
              </div>
              <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/70">
                {request.dateRangeLabel}
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-white/70">
              <span>
                {request.group.sizeCurrent}/{request.group.sizeTarget} в группе
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-white/75">
                Осталось{" "}
                {Math.max(0, request.group.sizeTarget - request.group.sizeCurrent)}{" "}
                мест
              </span>
              {typeof request.budgetPerPersonRub === "number" ? (
                <span className="ml-auto text-[11px] text-white">
                  от {formatRub(request.budgetPerPersonRub)} ₽ / чел
                </span>
              ) : null}
            </div>

            {request.highlights.length > 0 ? (
              <ul className="mt-1 flex flex-wrap gap-1.5 text-[10px] text-white/65">
                {request.highlights.slice(0, 3).map((item) => (
                  <li key={item} className="rounded-full bg-white/6 px-2 py-0.5">
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </Link>
        ))}
      </div>

      <Link
        href="/requests"
        className="inline-flex w-full items-center justify-center rounded-2xl border border-white/16 bg-transparent px-3 py-2 text-xs font-medium text-white/80 transition hover:border-white/40 hover:bg-white/10"
      >
        Смотреть все группы
      </Link>
    </div>
  );
}

function PopularDestinationsSection() {
  const destinations = getPopularDestinations();
  if (destinations.length === 0) return null;

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-white sm:p-5 lg:p-6">
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
          Популярные направления
        </p>
        <h2 className="text-[1.05rem] font-semibold tracking-tight sm:text-[1.15rem]">
          Куда сейчас чаще всего смотрят
        </h2>
        <p className="text-xs leading-relaxed text-white/70 sm:text-[13px]">
          Нажмите на город, чтобы открыть готовые маршруты и сравнить по формату и
          длине поездки.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {destinations.map((city) => (
          <Link
            key={city}
            href={`/listings?destination=${encodeURIComponent(city)}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/18 bg-white/6 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:border-white/50 hover:bg-white/14"
          >
            <span>{city}</span>
          </Link>
        ))}
      </div>

      <Link
        href="/listings"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-white/75 underline-offset-4 hover:text-white hover:underline"
      >
        Открыть все направления
        <ArrowUpRight className="size-3.5" />
      </Link>
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
        src={
          card.listing.coverImageUrl ??
          "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&h=1000&q=80"
        }
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
              <p className="truncate text-[15px] font-bold text-white">
                {card.guide.displayName}
              </p>
              <p className="truncate text-xs text-white/70">
                {card.listing.city}, Россия
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {card.listing.title}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/75">
                <div className="flex items-center gap-0.5 text-[#FACC15]">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="size-3 fill-current" />
                  ))}
                </div>
                <span className="font-semibold text-white/82">
                  {card.guide.reviewsSummary.averageRating.toFixed(1)}
                </span>
                <span className="text-white/60">
                  ({card.guide.reviewsSummary.totalReviews})
                </span>
              </div>
              <p className="mt-1 text-xs text-white/80">
                От {formatRub(card.listing.priceFromRub)} ₽ / человек
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
          <div className="max-w-[220px]">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/58">
              {card.listing.city}
            </p>
            <p className="mt-2 text-base font-semibold text-white">
              {card.listing.title}
            </p>
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
        <Image
          src={guide.avatarImageUrl}
          alt={guide.displayName}
          fill
          sizes="48px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-white/60 bg-white/18 text-sm font-bold text-white backdrop-blur-sm">
      {getGuideInitials(guide)}
    </div>
  );
}

