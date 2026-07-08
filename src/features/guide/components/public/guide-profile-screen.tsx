import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { TourCard } from "@/components/shared/tour-card";
import { NewGuideFrame } from "@/components/discovery/NewGuideFrame";
import type { PublicGuideProfile } from "@/data/public-guides/types";
import { formatRubNumber } from "@/data/money";
import { formatRussianDate } from "@/lib/dates";
import { ROUTES } from "@/lib/navigation";
import { pluralize } from "@/lib/utils";
import { GuidePhotoGrid } from "./guide-photo-grid";

interface GuideListing {
  slug?: string;
  id?: string;
  coverImageUrl?: string;
  imageUrl?: string;
  title?: string;
  rating?: number;
  priceFromRub?: number;
  price?: string;
}

interface GuideReview {
  id: string;
  name?: string;
  rating?: number;
  title?: string;
  body?: string;
  createdAt?: string;
  date?: string;
  initials?: string;
  author?: { displayName?: string };
}

interface Props {
  guide: PublicGuideProfile;
  listings?: GuideListing[];
  reviews?: GuideReview[];
  photos?: { id: string; locationName: string; imageUrl: string }[];
}

function Dot() {
  return <span className="size-[3px] rounded-full bg-on-surface-muted/60" />;
}

export function GuideProfileScreen({ guide, listings, reviews, photos = [] }: Props) {
  const rating = guide.reviewsSummary.averageRating;
  const totalReviews = guide.reviewsSummary.totalReviews;
  const tripsCompleted = guide.tripsCompleted ?? guide.completedTours;
  const recommendPct = guide.recommendPct ?? null;
  const isVerified = guide.verificationStatus === "approved";

  const showRating = rating > 0;
  const showReviews = totalReviews > 0;
  const showTrips = tripsCompleted > 0;
  const showRecommend = recommendPct != null && recommendPct > 0;
  const hasStats = showRating || showReviews || showTrips || showRecommend;

  const tourCards =
    listings && listings.length > 0
      ? listings.map((l: GuideListing) => ({
          href: `/listings/${l.slug ?? l.id ?? ""}`,
          imageUrl: l.coverImageUrl ?? l.imageUrl ?? "",
          title: l.title ?? "",
          guide: guide.displayName,
          rating: l.rating ?? guide.reviewsSummary.averageRating,
          price: l.priceFromRub
            ? `от ${formatRubNumber(l.priceFromRub)} ₽`
            : l.price ?? "",
        }))
      : null;

  const guideHasListings = Boolean(listings && listings.length > 0);

  const reviewCards: GuideReview[] = reviews && reviews.length > 0 ? reviews : [];

  return (
    <div>
      {/* Public guide detail uses a clean typographic hero. Do not render initials as
          oversized artwork: when a real guide photo is unavailable, the page should
          stay neutral instead of replacing the photo with a giant monogram. */}
      <section className="relative w-full overflow-hidden bg-surface-low">
        <div className="relative mx-auto flex min-h-[360px] max-w-page flex-col justify-end gap-7 px-5 pb-10 pt-24 md:min-h-[460px] md:px-8">
          <div className="relative max-w-[640px]">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-[12.5px] font-medium text-on-surface-muted">
              <span>{guide.homeBase}</span>
            </div>
            <h1 className="mb-4 text-[clamp(2.75rem,8vw,68px)] font-bold leading-[0.98] tracking-[-0.04em] text-on-surface">
              {guide.displayName}
            </h1>
            {guide.headline ? (
              <p className="max-w-[470px] text-[16.5px] leading-[1.5] text-on-surface-muted">
                {guide.headline}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="bg-surface">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)] py-12">
          <div className="mx-auto flex max-w-[720px] flex-col items-start text-left">
            {guide.avatarImageUrl ? (
              <Image
                src={guide.avatarImageUrl}
                alt={guide.displayName}
                width={256}
                height={256}
                priority
                className="mb-5 size-28 rounded-full border border-line object-cover object-top md:size-32"
              />
            ) : null}
            {isVerified ? (
              <span className="mb-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-success">
                <BadgeCheck className="size-4 text-success" strokeWidth={2.3} />
                Проверен
              </span>
            ) : null}

            {hasStats ? (
              <div className="flex flex-wrap items-center justify-start gap-[9px] text-[13.5px] text-on-surface-muted">
                {showRating ? (
                  <span className="inline-flex items-center gap-[5px] font-semibold text-on-surface">
                    <Star className="size-[15px] fill-[var(--gold)] text-[var(--gold)]" />
                    {rating.toLocaleString("ru-RU", {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
                  </span>
                ) : null}
                {showReviews ? (
                  <>
                    {showRating ? <Dot /> : null}
                    <span>
                      {totalReviews} {pluralize(totalReviews, "отзыв", "отзыва", "отзывов")}
                    </span>
                  </>
                ) : null}
                {showTrips ? (
                  <>
                    {showRating || showReviews ? <Dot /> : null}
                    <span>
                      {tripsCompleted} {pluralize(tripsCompleted, "поездка", "поездки", "поездок")}
                    </span>
                  </>
                ) : null}
                {showRecommend ? (
                  <>
                    {showRating || showReviews || showTrips ? <Dot /> : null}
                    <span>{recommendPct}% рекомендуют</span>
                  </>
                ) : null}
              </div>
            ) : null}

            {totalReviews === 0 ? (
              <NewGuideFrame
                guideName={guide.displayName}
                className="mt-6 w-full max-w-[38rem] text-left"
              />
            ) : null}

            <p className="mt-6 max-w-[38rem] leading-[1.7] text-muted-foreground">
              {guide.bio}
            </p>

            {guide.specialties.length > 0 ? (
              <div className="mt-6 flex flex-wrap justify-start gap-[7px]">
                {guide.specialties.map((specialty) => (
                  <Tag key={specialty} color="primary">
                    {specialty}
                  </Tag>
                ))}
              </div>
            ) : null}

            {guide.languages.length > 0 ? (
              <div className="mt-3 flex flex-wrap justify-start gap-[7px]">
                {guide.languages.map((lang) => (
                  <span
                    key={lang}
                    className="rounded-full border border-line bg-surface-low px-3 py-[5px] text-[12.5px] font-medium text-on-surface-muted"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center justify-start gap-3">
              <Button asChild>
                <Link href={`${ROUTES.newRequest.href}?guide=${guide.slug}`}>
                  Запросить этого гида
                </Link>
              </Button>
              {guideHasListings ? (
                <Button asChild variant="outline">
                  <a href="#excursions">Смотреть экскурсии</a>
                </Button>
              ) : null}
            </div>
            <p className="mt-3 text-[13px] text-on-surface-muted">
              Опишите поездку — гиды, включая этого, предложат программу и цену.
            </p>
          </div>
        </div>
      </section>

      {photos.length > 0 && (
        <section className="py-sec-pad">
          <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
            <GuidePhotoGrid photos={photos} />
          </div>
        </section>
      )}

      <section
        id="excursions"
        className={`bg-surface-low ${tourCards ? "py-sec-pad" : "pt-sec-pad pb-0"}`}
      >
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
          <h2 className="mb-7 font-display text-[clamp(1.875rem,3.5vw,2.375rem)] font-semibold leading-[1.1]">
            Готовые экскурсии
          </h2>
          {tourCards ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tourCards.map((tour) => (
                <TourCard
                  key={tour.href}
                  href={tour.href}
                  imageUrl={tour.imageUrl}
                  title={tour.title}
                  guide={tour.guide}
                  rating={tour.rating}
                  price={tour.price}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">У этого гида пока нет экскурсий.</p>
          )}
        </div>
      </section>

      <section className="bg-surface-low py-sec-pad">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
          <p className="mb-2 font-sans text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground">
            Отзывы
          </p>
          <h2 className="mb-7 font-display text-[clamp(1.875rem,3.5vw,2.375rem)] font-semibold leading-[1.1]">
            Что говорят путешественники
          </h2>
          {reviewCards.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reviewCards.map((rev) => {
                const reviewInitials =
                  rev.initials ||
                  (rev.author?.displayName
                    ? rev.author.displayName
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((p: string) => p[0])
                        .join("")
                        .toUpperCase()
                    : "??");
                const reviewName =
                  rev.name || rev.author?.displayName || "Путешественник";
                const reviewDate = rev.createdAt ? formatRussianDate(rev.createdAt) : rev.date ?? "";
                const reviewRating = rev.rating ?? 5;
                const reviewTitle = rev.title && rev.title !== "Отзыв" ? rev.title : "";
                const reviewBody = rev.body || rev.title || "";

                return (
                  <article
                    key={rev.id}
                    className="rounded-[16px] border border-border bg-card p-5 shadow-card"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-surface-low text-xs font-semibold text-primary">
                          {reviewInitials}
                        </div>
                        <div className="min-w-0">
                          <strong className="block truncate text-[15px] text-on-surface">
                            {reviewName}
                          </strong>
                          {reviewDate ? (
                            <small className="block text-[12.5px] text-on-surface-muted">
                              {reviewDate}
                            </small>
                          ) : null}
                        </div>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-[5px] text-[13.5px] font-semibold text-on-surface">
                        <Star className="size-[15px] fill-[var(--gold)] text-[var(--gold)]" />
                        {reviewRating.toFixed(1)}
                      </span>
                    </div>
                    {reviewTitle ? (
                      <strong className="mt-4 block text-[15px] text-on-surface">
                        {reviewTitle}
                      </strong>
                    ) : null}
                    <p className="mt-2 text-[0.9375rem] leading-[1.65] text-muted-foreground">
                      {reviewBody}
                    </p>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground">Отзывов пока нет.</p>
          )}
        </div>
      </section>
    </div>
  );
}
