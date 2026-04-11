import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicReviewsSection, type PublicReviewItem } from "@/features/reviews/components/public/public-reviews-section";
import { getListingBySlug, getGuideBySlug } from "@/data/supabase/queries";
import type { PublicListing, PublicListingInclusion } from "@/data/public-listings/types";
import { getReviewsForListing } from "@/lib/supabase/reviews";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const getListingPageData = cache(async (slug: string) => {
  const supabase = await createSupabaseServerClient();
  const listingResult = await getListingBySlug(supabase, slug);
  if (!listingResult.data) {
    return {
      listingResult,
      guideResult: { data: null, error: null },
      reviewRecords: [],
    };
  }

  const [guideResult, reviewRecords] = await Promise.all([
    getGuideBySlug(supabase, listingResult.data.guideSlug),
    getReviewsForListing(listingResult.data.id),
  ]);

  return {
    listingResult,
    guideResult,
    reviewRecords,
  };
});

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function serializeJsonLd(jsonLd: Record<string, unknown>) {
  return JSON.stringify(jsonLd).replace(/</g, "\\u003c");
}

function formatRub(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { listingResult } = await getListingPageData(slug);

  if (!listingResult.data) {
    return { title: "Экскурсия не найдена" };
  }

  return {
    title: listingResult.data.title,
    description: truncateText(listingResult.data.description || listingResult.data.title, 160),
    openGraph: listingResult.data.imageUrl
      ? {
          images: [
            {
              url: listingResult.data.imageUrl,
              alt: listingResult.data.title,
            },
          ],
        }
      : undefined,
  };
}

export default async function PublicListingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { listingResult, guideResult, reviewRecords } = await getListingPageData(slug);
  if (!listingResult.data) notFound();

  const l = listingResult.data;
  const listing: PublicListing = {
    slug: l.slug,
    title: l.title,
    city: l.destinationName,
    region: l.destinationRegion,
    coverImageUrl: l.imageUrl,
    durationDays: l.durationDays,
    priceFromRub: l.priceRub,
    groupSizeMax: l.groupSize,
    themes: [],
    highlights: l.description ? [l.description] : [l.title],
    itinerary: [],
    inclusions: l.inclusions.filter((value): value is PublicListingInclusion => true),
    guideSlug: l.guideSlug,
  };

  const guide = guideResult.data
    ? {
        slug: guideResult.data.slug,
        displayName: guideResult.data.fullName,
        homeBase: guideResult.data.homeBase,
        avatarImageUrl: guideResult.data.avatarUrl,
        avatarInitials: guideResult.data.initials,
        reviewsSummary: {
          averageRating: guideResult.data.rating,
          totalReviews: guideResult.data.reviewCount,
        },
      }
    : undefined;

  const reviewItems: PublicReviewItem[] = reviewRecords.map((review) => ({
    id: review.id,
    authorName: review.travelerName,
    rating: review.rating,
    title: review.title,
    body: review.body,
    createdAt: review.createdAt,
    bookingLabel: review.bookingLabel,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: l.title,
    description: l.description,
    image: l.imageUrl ? [l.imageUrl] : undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: l.destinationName,
      addressRegion: l.destinationRegion,
      addressCountry: "RU",
    },
    offers: {
      "@type": "Offer",
      price: l.priceRub,
      priceCurrency: "RUB",
      availability: "https://schema.org/InStock",
      url: `https://provodnik.app/listings/${l.slug}`,
    },
    url: `https://provodnik.app/listings/${l.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <main className="space-y-10 pb-16">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            {listing.coverImageUrl ? (
              <Image src={listing.coverImageUrl} alt={listing.title} fill priority sizes="100vw" className="object-cover" />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10" />
          </div>

          <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)] relative z-10 py-12 md:py-20">
            <div className="max-w-3xl space-y-4">
              <p className="font-sans text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground mb-2">{listing.region}</p>
              <h1 className="text-4xl font-semibold leading-none tracking-tight text-foreground md:text-5xl">
                {listing.title}
              </h1>
              <p className="text-base leading-7 text-muted-foreground">{listing.highlights[0]}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{listing.durationDays} дн.</Badge>
                <Badge variant="outline">Группа до {listing.groupSizeMax} чел.</Badge>
                <Badge variant="outline">от {formatRub(listing.priceFromRub)} ₽</Badge>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)] grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_360px]">
            <div className="space-y-6">
              <Card className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass">
                <CardHeader>
                  <CardTitle>О маршруте</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {listing.highlights.map((text) => (
                    <p key={text} className="text-sm leading-7 text-muted-foreground">
                      {text}
                    </p>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass">
                <CardHeader>
                  <CardTitle>Включено</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid gap-2 text-sm text-muted-foreground">
                    {listing.inclusions.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass">
                <CardHeader>
                  <CardTitle>Не включено</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid gap-2 text-sm text-muted-foreground">
                    <li>• Авиа и ж/д билеты</li>
                    <li>• Личные расходы</li>
                    <li>• Страховка</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <Card className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass">
                <CardContent className="space-y-4 p-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Стоимость</p>
                    <p className="mt-1 text-3xl font-semibold">от {formatRub(listing.priceFromRub)} ₽</p>
                    <p className="text-sm text-muted-foreground">на человека</p>
                  </div>

                  <Button asChild className="w-full">
                    <Link href={`/requests/new?listing=${listing.slug}${guide ? `&guide=${guide.slug}` : ""}`}>
                      Отправить запрос гиду
                    </Link>
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Оплата не взимается на этом шаге. Гид свяжется с вами,
                    уточнит детали и предложит удобный способ оплаты напрямую.
                  </p>
                  <Button asChild variant="ghost" className="w-full">
                    <Link href="/requests">Найти группу на похожий маршрут</Link>
                  </Button>
                  <p className="text-center text-[0.7rem] text-muted-foreground">
                    Нужна помощь?{" "}
                    <a
                      href="mailto:hello@provodnik.app?subject=Вопрос%20по%20туру"
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      Написать менеджеру
                    </a>
                  </p>

                  {guide ? (
                    <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Гид</p>
                      <p className="mt-1 font-medium text-foreground">{guide.displayName}</p>
                      <p className="text-sm text-muted-foreground">
                        {guide.homeBase} · {guide.reviewsSummary.averageRating.toFixed(1)} ★
                      </p>
                      <div className="mt-3">
                        <Button asChild variant="ghost" className="px-0">
                          <Link href={`/guide/${guide.slug}`}>Профиль →</Link>
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </aside>
          </div>
        </section>

        <section>
          <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
            <PublicReviewsSection
              title="Что говорят о поездке"
              reviews={reviewItems}
              summary={
                reviewItems.length > 0
                  ? {
                      averageRating:
                        Math.round((reviewItems.reduce((sum, item) => sum + item.rating, 0) / reviewItems.length) * 10) / 10,
                      totalReviews: reviewItems.length,
                      lastReviewAt: reviewItems[0]?.createdAt,
                    }
                  : undefined
              }
              emptyText="Пока у маршрута нет отзывов. Первый отзыв появится после завершённой поездки."
            />
          </div>
        </section>
      </main>
    </>
  );
}
