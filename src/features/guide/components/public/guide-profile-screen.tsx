import Image from "next/image";
import Link from "next/link";

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
  const isVerified = guide.verificationStatus === "approved";

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
    <div className="bg-[var(--surface)] text-[var(--on-surface)]">
      <section className="pt-[110px] pb-12 md:pb-16">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
          <div className="grid grid-cols-1 gap-8 rounded-[var(--card-radius)] border border-[var(--outline)] bg-[var(--surface-lowest)] p-[clamp(22px,4vw,36px)] shadow-[var(--card-shadow)] lg:grid-cols-[minmax(260px,380px)_minmax(0,1fr)] lg:gap-12">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] border border-[var(--outline)] bg-[var(--brand-50)]">
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
                <div className="flex h-full w-full items-center justify-center font-display text-[4.5rem] font-semibold text-[var(--primary)]">
                  {initials}
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-[var(--brand-50)] px-4 py-2 text-[0.8125rem] font-semibold text-[var(--primary)]">
                  {guide.homeBase}
                </span>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-50)] px-4 py-2 text-[0.8125rem] font-semibold text-[var(--primary)]">
                    <span aria-hidden="true">✓</span>
                    Проверенный гид
                  </span>
                ) : null}
              </div>

              <h1 className="mb-4 font-display text-[clamp(2.5rem,5vw,3.75rem)] font-semibold leading-[1.04] text-[var(--on-surface)]">
                {guide.displayName}
              </h1>

              <p className="max-w-[40rem] text-[1.125rem] leading-[1.65] text-[var(--on-surface-muted)]">
                {guide.headline}
              </p>

              <div className="my-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-[18px] bg-[var(--brand-50)] px-4 py-3">
                  <strong className="block font-sans text-[1.625rem] font-semibold leading-[1] tabular-nums text-[var(--on-surface)]">
                    {rating.toFixed(1)}
                  </strong>
                  <span className="mt-1 block text-[0.8125rem] font-medium text-[var(--on-surface-muted)]">
                    рейтинг
                  </span>
                </div>
                <div className="rounded-[18px] bg-[var(--brand-50)] px-4 py-3">
                  <strong className="block font-sans text-[1.625rem] font-semibold leading-[1] tabular-nums text-[var(--on-surface)]">
                    {totalReviews}
                  </strong>
                  <span className="mt-1 block text-[0.8125rem] font-medium text-[var(--on-surface-muted)]">
                    отзывов
                  </span>
                </div>
                <div className="rounded-[18px] bg-[var(--brand-50)] px-4 py-3">
                  <strong className="block font-sans text-[1.625rem] font-semibold leading-[1] tabular-nums text-[var(--on-surface)]">
                    {guide.completedTours}
                  </strong>
                  <span className="mt-1 block text-[0.8125rem] font-medium text-[var(--on-surface-muted)]">
                    поездок
                  </span>
                </div>
                <div className="rounded-[18px] bg-[var(--brand-50)] px-4 py-3">
                  <strong className="block font-sans text-[1.625rem] font-semibold leading-[1] tabular-nums text-[var(--on-surface)]">
                    {guide.yearsExperience}
                  </strong>
                  <span className="mt-1 block text-[0.8125rem] font-medium text-[var(--on-surface-muted)]">
                    лет опыта
                  </span>
                </div>
              </div>

              <div className="mb-8 flex flex-wrap gap-2.5">
                {guide.languages.map((lang) => (
                  <span
                    key={lang}
                    className="inline-flex items-center rounded-full bg-[var(--brand-50)] px-4 py-2 text-[0.875rem] font-semibold text-[var(--primary)]"
                  >
                    {lang}
                  </span>
                ))}
                {guide.specialties.map((specialty) => (
                  <span
                    key={specialty}
                    className="inline-flex items-center rounded-full bg-[var(--brand-50)] px-4 py-2 text-[0.875rem] font-semibold text-[var(--primary)]"
                  >
                    {specialty}
                  </span>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href="#guide-listings"
                  className="inline-flex w-full items-center justify-center rounded-[14px] bg-[var(--primary)] px-6 py-[15px] font-semibold text-white shadow-[0_14px_28px_-18px_var(--primary)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 sm:w-auto"
                >
                  Выбрать экскурсию
                </a>
                <p className="text-[0.9375rem] leading-[1.5] text-[var(--on-surface-muted)]">
                  Профиль, опыт и отзывы помогают выбрать гида до заявки.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-8 md:pb-10">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
          <article className="rounded-[var(--card-radius)] border border-[var(--outline)] bg-[var(--surface-lowest)] p-[clamp(22px,4vw,30px)] shadow-[var(--card-shadow)]">
            <p className="mb-3 font-sans text-[0.75rem] font-semibold tracking-[0.1em] text-[var(--primary)] uppercase">
              О гиде
            </p>
            <h2 className="mb-4 font-display text-[clamp(1.875rem,3.5vw,2.375rem)] font-semibold leading-[1.1] text-[var(--on-surface)]">
              Почему с {guide.displayName} спокойно ехать
            </h2>
            <p className="max-w-[52rem] text-[1rem] leading-[1.75] text-[var(--on-surface-muted)]">
              {guide.bio}
            </p>
          </article>
        </div>
      </section>

      {photos.length > 0 && (
        <section className="pb-8 md:pb-10">
          <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
            <GuidePhotoGrid photos={photos} />
          </div>
        </section>
      )}

      <section id="guide-listings" className="scroll-mt-28 pb-8 md:pb-10">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
          <article className="rounded-[var(--card-radius)] border border-[var(--outline)] bg-[var(--surface-lowest)] p-[clamp(22px,4vw,30px)] shadow-[var(--card-shadow)]">
            <p className="mb-3 font-sans text-[0.75rem] font-semibold tracking-[0.1em] text-[var(--primary)] uppercase">
              Экскурсии
            </p>
            <h2 className="mb-7 font-display text-[clamp(1.875rem,3.5vw,2.375rem)] font-semibold leading-[1.1] text-[var(--on-surface)]">
              Готовые экскурсии
            </h2>
            {tourCards ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tourCards.map((tour) => (
                  <Link
                    key={tour.href}
                    href={tour.href}
                    className="group overflow-hidden rounded-[22px] border border-[var(--outline)] bg-[var(--surface-lowest)] shadow-[var(--card-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-22px_rgba(10,40,28,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-[var(--brand-50)]">
                      <Image
                        src={tour.imageUrl}
                        alt={tour.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-[1.35rem] font-semibold leading-[1.15] text-[var(--on-surface)]">
                        {tour.title}
                      </h3>
                      <p className="mt-3 text-[0.875rem] text-[var(--on-surface-muted)]">
                        {tour.guide}
                        {tour.rating !== undefined ? ` · ${tour.rating} ★` : null}
                      </p>
                      <div className="mt-4 inline-flex rounded-full bg-[var(--brand-50)] px-4 py-2 text-[0.875rem] font-semibold text-[var(--primary)]">
                        {tour.price}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-[var(--on-surface-muted)]">У этого гида пока нет экскурсий.</p>
            )}
          </article>
        </div>
      </section>

      <section className="pb-16 md:pb-20">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
          <article className="rounded-[var(--card-radius)] border border-[var(--outline)] bg-[var(--surface-lowest)] p-[clamp(22px,4vw,30px)] shadow-[var(--card-shadow)]">
            <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-3 font-sans text-[0.75rem] font-semibold tracking-[0.1em] text-[var(--primary)] uppercase">
                  Отзывы
                </p>
                <h2 className="font-display text-[clamp(1.875rem,3.5vw,2.375rem)] font-semibold leading-[1.1] text-[var(--on-surface)]">
                  Что говорят путешественники
                </h2>
              </div>
              <div className="w-fit rounded-full bg-[var(--brand-50)] px-4 py-2 text-[0.9375rem] font-semibold text-[var(--primary)]">
                {rating.toFixed(1)} ★ · {totalReviews} отзывов
              </div>
            </div>
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
                    <article
                      key={rev.id}
                      className="rounded-[22px] border border-[var(--outline)] bg-[var(--surface-lowest)] p-5"
                    >
                      <div className="mb-4 flex items-start gap-3.5">
                        <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-[var(--brand-50)] text-xs font-semibold text-[var(--primary)]">
                          {reviewInitials}
                        </div>
                        <div>
                          <strong className="mb-1 block text-[var(--on-surface)]">
                            {reviewName}
                          </strong>
                          <small className="block text-[var(--on-surface-muted)]">
                            {reviewDate}
                            {reviewDate ? " · " : ""}
                            {reviewRating.toFixed(1)} ★
                          </small>
                        </div>
                      </div>
                      <p className="text-[0.9375rem] leading-[1.65] text-[var(--on-surface-muted)]">
                        {reviewBody}
                      </p>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="text-[var(--on-surface-muted)]">Отзывов пока нет.</p>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}
