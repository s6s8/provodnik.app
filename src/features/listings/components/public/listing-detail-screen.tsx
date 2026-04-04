import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { PublicListing } from "@/data/public-listings/types";

interface Props {
  listing: PublicListing;
  guide?: any;
  reviews?: any[];
}

const fallbackCover =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1800&q=80";

const galleryThumbs = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80&crop=top",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80&crop=center",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80&crop=bottom",
];

const defaultExclusions = ["Авиабилеты", "Личные расходы", "Страховка"];

const fallbackReviews = [
  {
    id: "r1",
    initials: "АМ",
    name: "Анна Миронова",
    rating: 4.9,
    body: "Понравилось, что даже на сложном маршруте было ощущение собранности и контроля. Никакой суеты между точками, всё объяснено заранее.",
  },
  {
    id: "r2",
    initials: "РК",
    name: "Роман Котов",
    rating: 4.9,
    body: "Сильнейший момент — маршрут реально держит контраст и не превращается в хаотичный набор вау-остановок.",
  },
  {
    id: "r3",
    initials: "ТС",
    name: "Татьяна Соколова",
    rating: 4.8,
    body: "Неожиданно комфортный темп. Было понятно, где усилие, а где отдых, и это сделало поездку очень ровной по ощущениям.",
  },
];

function getGuideInitials(guide: any): string {
  if (!guide) return "ГД";
  if (guide.avatarInitials) return guide.avatarInitials;
  const name: string = guide.displayName || guide.name || "";
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p: string) => p[0])
      .join("")
      .toUpperCase() || "ГД"
  );
}

export function ListingDetailScreen({ listing, guide, reviews }: Props) {
  const coverImage = listing.coverImageUrl || fallbackCover;
  const priceFormatted = new Intl.NumberFormat("ru-RU").format(
    listing.priceFromRub,
  );
  const reviewCards = reviews && reviews.length > 0 ? reviews : fallbackReviews;

  const guideInitials = getGuideInitials(guide);
  const guideName = guide?.displayName || guide?.name || "Местный гид";
  const guideRating = guide?.reviewsSummary?.averageRating?.toFixed(1) ?? "4.9";
  const guideSlug = guide?.slug ?? "#";
  const guideRegion = guide?.homeBase ?? listing.region;

  return (
    <main>
      <section className="-mt-nav-h relative flex min-h-[520px] items-end overflow-hidden pb-14 [--on-surface:#fff] [--on-surface-muted:rgba(255,255,255,0.72)]">
        <Image
          src={coverImage}
          alt={listing.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        <div
          className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,rgba(25,28,32,0.12)_0%,rgba(25,28,32,0.38)_55%,rgba(25,28,32,0.60)_100%)]"
          aria-hidden
        />

        <div className="relative z-[2] mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)] pt-[calc(var(--nav-h)+48px)] pb-14 [--on-surface:#fff] [--on-surface-muted:rgba(255,255,255,0.72)]">
          <p className="mb-2 font-sans text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-white/70">
            Авторский тур · {listing.region}
          </p>

          <h1 className="max-w-[18ch] font-display text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-[1.03]">
            {listing.title}
          </h1>

          <div className="mt-[18px] flex flex-wrap gap-2.5">
            {[
              `${listing.durationDays} дней`,
              `Группа до ${listing.groupSizeMax} человек`,
              `от ${priceFormatted} ₽`,
            ].map((label) => (
              <span
                key={label}
                className="inline-flex items-center rounded-full border border-white/20 bg-glass px-3.5 py-1.5 text-[0.8125rem] font-medium text-white/90 backdrop-blur-[12px]"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-sec-pad">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,2fr)_360px]">
            <div className="grid gap-8">
              <div className="grid gap-3">
                <div className="relative aspect-[16/9] overflow-hidden rounded-[20px]">
                  <Image
                    src={coverImage}
                    alt={listing.title}
                    fill
                    sizes="(max-width: 1023px) 100vw, 66vw"
                    className="object-cover"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {galleryThumbs.map((src, i) => (
                    <div
                      key={i}
                      className="relative aspect-[16/11] overflow-hidden rounded-[18px]"
                    >
                      <Image
                        src={src}
                        alt={`${listing.title} — фото ${i + 2}`}
                        fill
                        sizes="(max-width: 1023px) 33vw, 22vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <section>
                <h2 className="mb-[14px] font-display text-[1.875rem] leading-[1.08]">
                  О маршруте
                </h2>
                {listing.highlights.map((text, i) => (
                  <p
                    key={i}
                    className={`text-[0.9375rem] leading-[1.72] text-muted-foreground ${
                      i > 0 ? "mt-[14px]" : ""
                    }`}
                  >
                    {text}
                  </p>
                ))}
              </section>

              <section>
                <h2 className="mb-[18px] font-display text-[1.875rem] leading-[1.08]">
                  Программа по дням
                </h2>
                <ol className="grid gap-[14px]">
                  {listing.itinerary.map((item, index) => (
                    <li
                      key={`${item.title}-${index}`}
                      className="flex gap-[14px] text-[0.9375rem] leading-[1.72] text-muted-foreground"
                    >
                      <strong className="shrink-0 text-foreground">
                        День {index + 1}.
                      </strong>
                      <span>
                        <strong className="text-foreground">{item.title}.</strong>{" "}
                        {item.description}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>

              <section>
                <h2 className="mb-[18px] font-display text-[1.875rem] leading-[1.08]">
                  Что включено
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  <ul className="grid gap-2.5">
                    {listing.inclusions.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 text-[0.9375rem] leading-[1.6] text-muted-foreground"
                      >
                        <span className="shrink-0 font-semibold text-primary">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <ul className="grid gap-2.5">
                    {defaultExclusions.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 text-[0.9375rem] leading-[1.6] text-muted-foreground"
                      >
                        <span className="shrink-0 font-semibold text-muted-foreground">
                          ✗
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </div>

            <aside className="sticky top-24 grid gap-0 rounded-[28px] border border-glass-border bg-glass p-7 shadow-glass backdrop-blur-[20px]">
              <div className="font-display text-[2.4rem] leading-none text-foreground">
                от {priceFormatted} ₽
              </div>
              <p className="mt-2 text-sm text-muted-foreground">на человека</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Группа 4–{listing.groupSizeMax} человек · {listing.durationDays}{" "}
                {listing.durationDays === 1
                  ? "день"
                  : listing.durationDays < 5
                    ? "дня"
                    : "дней"}
              </p>

              <Button asChild className="mt-[18px] w-full">
                <Link href={`/requests/new?listing=${listing.slug}`}>
                  Создать запрос
                </Link>
              </Button>
              <Button asChild variant="outline" className="mt-2.5 w-full">
                <Link href="/requests">Найти группу</Link>
              </Button>

              <div className="my-5 h-px bg-[rgba(194,198,214,0.30)]" />

              <div className="flex items-center justify-between gap-3 rounded-2xl bg-background p-[14px]">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-low text-[0.8125rem] font-semibold text-primary">
                    {guide?.avatarImageUrl ? (
                      <Image
                        src={guide.avatarImageUrl}
                        alt={guideName}
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      guideInitials
                    )}
                  </div>
                  <div>
                    <strong className="block text-[0.9375rem]">{guideName}</strong>
                    <span className="text-[0.8125rem] text-muted-foreground">
                      {guideRegion} · {guideRating} ★
                    </span>
                  </div>
                </div>
                <Link
                  href={`/guides/${guideSlug}`}
                  className="whitespace-nowrap text-sm font-semibold text-primary"
                >
                  Профиль →
                </Link>
              </div>

              <p className="mt-[14px] text-[0.8125rem] text-muted-foreground">
                Оплата после подтверждения состава группы и дат.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-surface-low py-sec-pad">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
          <p className="mb-2 font-sans text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground">
            Отзывы
          </p>
          <h2 className="mb-7 font-display text-[clamp(1.875rem,3.5vw,2.375rem)] font-semibold leading-[1.1]">
            Что говорят о поездке
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reviewCards.map((rev: any) => {
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
              const reviewRating = rev.rating ?? 5;
              const reviewBody = rev.body || rev.title || "";

              return (
                <article key={rev.id} className="flex items-start gap-3.5">
                  <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-[rgba(194,198,214,0.30)] bg-surface-low text-xs font-semibold text-primary">
                    {reviewInitials}
                  </div>
                  <div>
                    <strong className="mb-1 block">{reviewName}</strong>
                    <small className="mb-2 block text-muted-foreground">
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
        </div>
      </section>
    </main>
  );
}
