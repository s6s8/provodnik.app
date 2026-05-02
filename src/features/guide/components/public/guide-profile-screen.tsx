import Image from "next/image";

import { TourCard } from "@/components/shared/tour-card";
import type { PublicGuideProfile } from "@/data/public-guides/types";
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

function getInitials(name: string, fallback?: string): string {
  if (fallback) return fallback;
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function GuideProfileScreen({ guide, listings, reviews, photos = [] }: Props) {
  const initials = getInitials(guide.displayName, guide.avatarInitials);
  const rating = guide.reviewsSummary.averageRating;
  const totalReviews = guide.reviewsSummary.totalReviews;

  const tourCards =
    listings && listings.length > 0
      ? listings.map((l: GuideListing) => ({
          href: `/listings/${l.slug ?? l.id ?? ""}`,
          imageUrl: l.coverImageUrl ?? l.imageUrl ?? "",
          title: l.title ?? "",
          guide: guide.displayName,
          rating: l.rating ?? guide.reviewsSummary.averageRating,
          price: l.priceFromRub
            ? `от ${new Intl.NumberFormat("ru-RU").format(Math.round(l.priceFromRub / 1000))} тыс. ₽`
            : l.price ?? "",
        }))
      : null;

  const reviewCards: GuideReview[] = reviews && reviews.length > 0 ? reviews : [];

  return (
    <div>
      <section className="bg-surface pt-[110px] pb-16">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-14">
            <div className="relative aspect-[3/4] overflow-hidden rounded-[28px] bg-surface-low">
              {guide.avatarImageUrl ? (
                <Image
                  src={guide.avatarImageUrl.replace("w=400&h=400", "w=600&h=800")}
                  alt={guide.displayName}
                  fill
                  sizes="(max-width: 767px) 100vw, 380px"
                  className="object-cover object-top"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-display text-[4rem] text-primary">
                  {initials}
                </div>
              )}
            </div>

            <div className="pt-2">
              <p className="mb-2 font-sans text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground">
                {guide.homeBase}
              </p>

              <h1 className="mt-2 mb-4 font-display text-[clamp(2.5rem,5vw,3.5rem)] leading-[1.05] text-foreground">
                {guide.displayName}
              </h1>

              <p className="mb-6 max-w-[36rem] text-[1.0625rem] leading-[1.65] text-muted-foreground">
                {guide.headline}
              </p>

              <div className="mb-6 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-surface-low px-3.5 py-1.5 text-[0.8125rem] text-muted-foreground">
                  {rating.toFixed(1)} / 5 · {totalReviews} отзывов
                </span>
                <span className="inline-flex items-center rounded-full bg-surface-low px-3.5 py-1.5 text-[0.8125rem] text-muted-foreground">
                  {guide.yearsExperience} лет опыта
                </span>
              </div>

              <div className="mb-7 grid w-fit grid-cols-3 gap-8 border-b border-outline-variant pb-7">
                <div className="flex flex-col">
                  <strong className="font-sans text-[2rem] font-semibold leading-[1] tabular-nums text-foreground">
                    {rating.toFixed(1)}
                  </strong>
                  <span className="mt-1 text-[0.8125rem] text-muted-foreground">рейтинг</span>
                </div>
                <div className="flex flex-col">
                  <strong className="font-sans text-[2rem] font-semibold leading-[1] tabular-nums text-foreground">
                    {totalReviews}
                  </strong>
                  <span className="mt-1 text-[0.8125rem] text-muted-foreground">поездок</span>
                </div>
                <div className="flex flex-col">
                  <strong className="font-sans text-[2rem] font-semibold leading-[1] tabular-nums text-foreground">
                    {guide.yearsExperience}
                  </strong>
                  <span className="mt-1 text-[0.8125rem] text-muted-foreground">лет опыта</span>
                </div>
              </div>

              <p className="mb-6 max-w-[38rem] leading-[1.7] text-muted-foreground">
                {guide.bio}
              </p>

              <div className="mb-8 flex flex-wrap gap-2">
                {guide.languages.map((lang) => (
                  <span
                    key={lang}
                    className="inline-flex items-center rounded-full bg-surface-low px-3.5 py-1.5 text-[0.8125rem] text-muted-foreground"
                  >
                    {lang}
                  </span>
                ))}
                {guide.specialties.map((specialty) => (
                  <span
                    key={specialty}
                    className="inline-flex items-center rounded-full bg-surface-low px-3.5 py-1.5 text-[0.8125rem] text-muted-foreground"
                  >
                    {specialty}
                  </span>
                ))}
              </div>

            </div>
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

      <section className="bg-surface-low py-sec-pad">
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
                const reviewDate =
                  rev.date ||
                  (rev.createdAt
                    ? new Date(rev.createdAt).toLocaleDateString("ru-RU", {
                        month: "long",
                        year: "numeric",
                      })
                    : "");
                const reviewRating = rev.rating ?? 5;
                const reviewBody = rev.body || rev.title || "";

                return (
                  <article key={rev.id} className="flex items-start gap-3.5">
                    <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-surface-low text-xs font-semibold text-primary">
                      {reviewInitials}
                    </div>
                    <div>
                      <strong className="mb-1 block">{reviewName}</strong>
                      <small className="mb-2 block text-muted-foreground">
                        {reviewDate}
                        {reviewDate ? " · " : ""}
                        {reviewRating.toFixed(1)}
                      </small>
                      <p className="text-[0.9375rem] leading-[1.65] text-muted-foreground">
                        {reviewBody}
                      </p>
                    </div>
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
