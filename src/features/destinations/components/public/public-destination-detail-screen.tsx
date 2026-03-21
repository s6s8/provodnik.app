import Image from "next/image";
import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { PublicGuideCard } from "@/features/guide/components/public/public-guide-card";
import { PublicRequestCard } from "@/features/requests/components/public/public-request-card";
import type { DestinationSummary } from "@/data/destinations/types";
import type { PublicGuideProfile } from "@/data/public-guides/types";
import type { PublicListing } from "@/data/public-listings/types";
import type { OpenRequestRecord } from "@/data/open-requests/types";

function DestinationListingCard({
  listing,
  featured = false,
}: {
  listing: PublicListing;
  featured?: boolean;
}) {
  return (
    <Link
      href={`/listings/${listing.slug}`}
      className={[
        "group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-black",
        featured ? "md:col-span-2" : "",
      ].join(" ")}
    >
      <div className={featured ? "relative min-h-[320px]" : "relative min-h-[280px]"}>
        <Image
          src={
            listing.coverImageUrl ??
            "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80"
          }
          alt={listing.title}
          fill
          sizes={
            featured
              ? "(max-width: 768px) 92vw, 66vw"
              : "(max-width: 768px) 92vw, 33vw"
          }
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent transition-all duration-300 group-hover:from-black/92" />

        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
              {listing.city}, {listing.region}
            </p>
            <h3 className="max-w-2xl text-xl font-semibold tracking-tight text-white">
              {listing.title}
            </h3>
            <p className="max-w-2xl text-sm leading-6 text-white/70">
              {listing.highlights[0]}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function PublicDestinationDetailScreen({
  destination,
  requests,
  listings,
  guides,
}: {
  destination: DestinationSummary;
  requests: OpenRequestRecord[];
  listings: PublicListing[];
  guides: PublicGuideProfile[];
}) {
  const featuredListing = listings[0];
  const standardListings = listings.slice(1);

  return (
    <div className="flex flex-col gap-16 md:gap-20 lg:gap-24">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black">
        <div className="relative min-h-[50vh]">
          <Image
            src={
              destination.imageUrl ??
              "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80"
            }
            alt={destination.name}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-10">
            <div className="max-w-3xl space-y-4">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-white/75">
                {destination.region ?? "Россия"}
              </span>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  {destination.name}
                </h1>
                {destination.description ? (
                  <p className="max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
                    {destination.description}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="editorial-kicker">Открытые группы</p>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Открытые группы в этом городе
            </h2>
          </div>
          <Link
            href={`/requests?destination=${destination.slug}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition-all duration-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            Все запросы в этом городе
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {requests.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-5">
            {requests.map((request) => (
              <PublicRequestCard key={request.id} request={request} />
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-[1.5rem] border border-white/10 p-6 text-sm text-white/65">
            Пока нет открытых групп по этому направлению.
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <p className="editorial-kicker">Готовые маршруты</p>
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Популярные туры
          </h2>
        </div>

        {featuredListing ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
            <DestinationListingCard listing={featuredListing} featured />
            {standardListings.map((listing) => (
              <DestinationListingCard key={listing.slug} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-[1.5rem] border border-white/10 p-6 text-sm text-white/65">
            В этом направлении пока нет опубликованных туров.
          </div>
        )}
      </section>

      <section id="guides" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="editorial-kicker">Местная экспертиза</p>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Местные проводники
            </h2>
          </div>
          <Link
            href="#guides"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition-all duration-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            Все гиды
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {guides.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 md:gap-5">
            {guides.map((guide) => (
              <PublicGuideCard
                key={guide.slug}
                guide={{
                  id: guide.slug,
                  name: guide.displayName,
                  avatarUrl:
                    guide.avatarImageUrl ??
                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
                  rating: guide.reviewsSummary.averageRating,
                  tourCount: listings.filter((listing) => listing.guideSlug === guide.slug)
                    .length,
                  specialties: [...guide.specialties],
                  cities: [guide.homeBase, ...guide.regions.slice(0, 2)],
                }}
              />
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-[1.5rem] border border-white/10 p-6 text-sm text-white/65">
            Для этого направления мы еще не добавили карточки локальных гидов.
          </div>
        )}
      </section>
    </div>
  );
}
