import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Star } from "lucide-react";

import { HelpArticle } from "@/components/help/HelpArticle";
import { ListingCard } from "@/components/shared/listing-card";
import { PublicGuideCard } from "@/components/shared/public-guide-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { Scrim } from "@/components/ui/scrim";
import { HELP_FALLBACK_ARTICLES } from "@/data/help-articles";
import type { DestinationOption, GuideRecord, ListingRecord } from "@/data/supabase/queries";
import { cityImage } from "@/lib/city-image";
import { formatRussianDate } from "@/lib/dates";
import type { HomepageReview } from "@/lib/supabase/homepage";
import { pluralize } from "@/lib/utils";

/**
 * Minimum real, moderated items a block needs before it is worth showing
 * (default D-C2a). Below the minimum the block renders NOTHING — no
 * placeholder, no skeleton, no "скоро": a young marketplace must read as
 * intentional, not broken.
 */
export const HOMEPAGE_MIN = {
  listings: 3,
  destinations: 3,
  guides: 3,
  reviews: 2,
} as const;

interface Props {
  listings: ListingRecord[];
  destinations: DestinationOption[];
  guides: GuideRecord[];
  reviews: HomepageReview[];
}

const SECTION = "mx-auto w-full max-w-page px-gutter";
const DESTINATION_CARDS = 6;

export function HomepageInventoryClassic({ listings, destinations, guides, reviews }: Props) {
  const showListings = listings.length >= HOMEPAGE_MIN.listings;
  const showDestinations = destinations.length >= HOMEPAGE_MIN.destinations;
  const showGuides = guides.length >= HOMEPAGE_MIN.guides;
  const showReviews = reviews.length >= HOMEPAGE_MIN.reviews;

  return (
    <>
      {showListings && (
        <section className={`${SECTION} py-14`} aria-label="Готовые экскурсии">
          <SectionHeading
            title="Готовые экскурсии"
            subtitle="Авторские маршруты от проверенных гидов — можно забронировать сразу"
            action={{ label: "Все экскурсии", href: "/listings" }}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      )}

      {showDestinations && (
        <section className={`${SECTION} py-14`} aria-label="Популярные направления">
          <SectionHeading title="Популярные направления" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.slice(0, DESTINATION_CARDS).map((destination) => (
              <Link
                key={`${destination.name}-${destination.region}`}
                href={`/guides?q=${encodeURIComponent(destination.name)}`}
                className="group relative block aspect-[16/9] overflow-hidden rounded-card border border-border transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-[3px] hover:shadow-lift motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Image
                  src={cityImage(destination.name)}
                  alt=""
                  fill
                  sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <Scrim />
                <div className="absolute inset-x-4 bottom-4 text-white">
                  <span className="block text-lg font-bold tracking-[-0.02em]">
                    {destination.name}
                  </span>
                  <span className="block text-sm text-white/80">
                    {destination.guideCount}{" "}
                    {pluralize(destination.guideCount, "гид", "гида", "гидов")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {showGuides && (
        <section className={`${SECTION} py-14`} aria-label="Гиды">
          <SectionHeading
            title="Гиды"
            subtitle="Аккредитованные местные гиды, готовые взять ваш запрос"
            action={{ label: "Все гиды", href: "/guides" }}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((guide) => (
              <PublicGuideCard
                key={guide.id}
                slug={guide.slug}
                fullName={guide.fullName}
                initials={guide.initials}
                avatarUrl={guide.avatarUrl}
                rating={guide.rating}
                reviewCount={guide.reviewCount}
                verified={guide.verified}
                experienceYears={guide.experienceYears}
                specialties={guide.specialties}
                tripsCompleted={guide.tripsCompleted}
                recommendPct={guide.recommendPct}
                languages={guide.languages}
              />
            ))}
          </div>
        </section>
      )}

      {showReviews && (
        <section className="border-y border-border bg-surface" aria-label="Отзывы">
          <div className={`${SECTION} py-14`}>
            <SectionHeading title="Отзывы" subtitle="Что говорят путешественники" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-card border border-border bg-card p-5 shadow-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-surface-low text-xs font-semibold text-primary">
                        {review.authorInitials}
                      </div>
                      <div className="min-w-0">
                        <strong className="block truncate text-sm text-on-surface">
                          {review.authorName}
                        </strong>
                        <small className="block text-xs text-on-surface-muted">
                          {formatRussianDate(review.createdAt)}
                        </small>
                      </div>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-[5px] text-sm font-semibold text-on-surface">
                      <Star className="size-[15px] fill-gold text-gold" aria-hidden />
                      {review.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-4 line-clamp-4 text-[0.9375rem] leading-[1.65] text-muted-foreground">
                    {review.body}
                  </p>
                  <Link
                    href={`/guides/${review.guideSlug}`}
                    className="mt-4 inline-block text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                  >
                    Гид: {review.guideName}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className={`${SECTION} py-14`} aria-label="Вопросы и ответы">
        <SectionHeading title="Вопросы и ответы" action={{ label: "Центр помощи", href: "/help" }} />
        <div className="mx-auto w-full max-w-3xl">
          {HELP_FALLBACK_ARTICLES.map((article) => (
            <details key={article.id} className="group border-b border-border">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 py-4 text-base font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                {article.title}
                <ChevronDown
                  className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="pb-4 text-sm">
                <HelpArticle body={article.body_md} />
              </div>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
