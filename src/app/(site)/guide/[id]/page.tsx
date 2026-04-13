import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cache } from "react";

import Link from "next/link";

import { TourCard } from "@/components/shared/tour-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicGuideTrustMarkers } from "@/features/guide/components/public/public-guide-trust-markers";
import { PublicReviewsSection, type PublicReviewItem } from "@/features/reviews/components/public/public-reviews-section";
import { getGuideBySlug, getListingsByGuide } from "@/data/supabase/queries";
import type { PublicGuideProfile } from "@/data/public-guides/types";
import { getReviewsForGuide } from "@/lib/supabase/reviews";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const getGuidePageData = cache(async (id: string) => {
  const supabase = await createSupabaseServerClient();
  const guideResult = await getGuideBySlug(supabase, id);
  if (!guideResult.data) {
    return {
      guideResult,
      guideProfile: null,
      listingRecords: [],
      reviewRecords: [],
    };
  }

  const { data: guideProfile, error: profileError } = await supabase
    .from("guide_profiles")
    .select("user_id, slug, verification_status, completed_tours, display_name, bio, years_experience, regions, languages, specialties, rating")
    .eq("user_id", guideResult.data.id)
    .maybeSingle();

  if (profileError) throw profileError;

  const [listingsResult, reviewRecords] = await Promise.all([
    getListingsByGuide(supabase, guideResult.data.id),
    getReviewsForGuide(guideResult.data.id),
  ]);

  return {
    guideResult,
    guideProfile,
    listingRecords: listingsResult.data ?? [],
    reviewRecords,
  };
});

function serializeJsonLd(jsonLd: Record<string, unknown>) {
  return JSON.stringify(jsonLd).replace(/</g, "\\u003c");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { guideResult } = await getGuidePageData(id);

  if (!guideResult.data) {
    return { title: "Гид не найден" };
  }

  return {
    title: guideResult.data.fullName,
    description: guideResult.data.bio,
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { guideResult, guideProfile, listingRecords, reviewRecords } = await getGuidePageData(id);
  if (!guideResult.data) notFound();

  const g = guideResult.data;
  const verificationStatus = guideProfile?.verification_status ?? "draft";
  const completedTours = guideProfile?.completed_tours ?? 0;
  const averageRating = guideProfile?.rating ?? g.rating;
  const totalReviews = reviewRecords.length || g.reviewCount;
  const reviewItems: PublicReviewItem[] = reviewRecords.map((review) => ({
    id: review.id,
    authorName: review.travelerName,
    rating: review.rating,
    title: review.title,
    body: review.body,
    createdAt: review.createdAt,
    bookingLabel: review.bookingLabel,
  }));

  const guide: PublicGuideProfile = {
    slug: g.slug,
    displayName: g.fullName,
    headline: g.bio.slice(0, 120),
    homeBase: g.homeBase,
    verificationStatus,
    completedTours,
    avatarInitials: g.initials,
    avatarImageUrl: g.avatarUrl,
    yearsExperience: g.experienceYears,
    regions: g.destinations,
    languages: guideProfile?.languages ?? [],
    specialties: guideProfile?.specialties ?? [],
    bio: g.bio,
    trustMarkers: {
      emailVerified: false,
      phoneVerified: false,
      identityVerified: verificationStatus === "approved",
      backgroundCheck: false,
      references: false,
    },
    reviewsSummary: {
      averageRating,
      totalReviews,
      lastReviewAt: reviewItems[0]?.createdAt,
    },
  };

  const listings = listingRecords.map((l) => ({
    slug: l.slug,
    title: l.title,
    city: l.destinationName,
    region: l.destinationRegion,
    coverImageUrl: l.imageUrl,
    durationDays: Math.min(3, Math.max(1, l.durationDays)) as 1 | 2 | 3,
    priceFromRub: l.priceRub,
    groupSizeMax: l.groupSize,
    themes: [],
    highlights: l.description ? [l.description] : [l.title],
    itinerary: [{ title: l.title, description: l.description, durationHours: l.durationDays * 6 }],
    inclusions: l.inclusions as string[],
    guideSlug: l.guideSlug,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: g.fullName,
    description: g.bio,
    image: g.avatarUrl,
    areaServed: g.destinations.length > 0 ? g.destinations : [g.homeBase],
    url: `https://provodnik.app/guide/${id}`,
    aggregateRating:
      totalReviews > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: averageRating,
            reviewCount: totalReviews,
          }
        : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <main className="space-y-10 pb-16">
        <section className="py-8 md:py-12">
          <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)] grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-8 lg:gap-14 items-start">
            <Card className="overflow-hidden border-border/70 bg-card/80 shadow-card">
              <div className="relative aspect-[3/4] bg-muted">
                {guide.avatarImageUrl ? (
                  <Image
                    src={guide.avatarImageUrl.replace("w=400&h=400", "w=800&h=1000")}
                    alt={guide.displayName}
                    fill
                    priority
                    sizes="(max-width: 1023px) 100vw, 380px"
                    className="object-cover object-top"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-5xl font-semibold text-primary">
                    {guide.avatarInitials}
                  </div>
                )}
              </div>
            </Card>

            <div className="space-y-6">
              <div className="space-y-4">
                <p className="font-sans text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground mb-2">{guide.homeBase}</p>
                <div className="space-y-3">
                  <h1 className="text-4xl font-semibold leading-none tracking-tight text-foreground md:text-5xl">
                    {guide.displayName}
                  </h1>
                  <p className="max-w-3xl text-base leading-7 text-muted-foreground">
                    {guide.headline}
                  </p>
                </div>
              </div>

              <PublicGuideTrustMarkers
                verificationStatus={guide.verificationStatus}
                rating={guide.reviewsSummary.averageRating}
                completedTours={guide.completedTours}
                reviewCount={guide.reviewsSummary.totalReviews}
              />

              <Card className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass">
                <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Рейтинг</p>
                    <p className="mt-1 text-2xl font-semibold">{guide.reviewsSummary.averageRating.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Поездок</p>
                    <p className="mt-1 text-2xl font-semibold">{guide.completedTours}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Опыт</p>
                    <p className="mt-1 text-2xl font-semibold">{guide.yearsExperience}</p>
                  </div>
                </CardContent>
              </Card>

              <p className="max-w-3xl text-sm leading-7 text-muted-foreground">{guide.bio}</p>

              <div className="flex flex-wrap gap-2">
                {guide.languages.map((lang) => (
                  <Badge key={lang} variant="outline">
                    {lang}
                  </Badge>
                ))}
                {guide.specialties.map((specialty) => (
                  <Badge key={specialty} variant="outline">
                    {specialty}
                  </Badge>
                ))}
              </div>

              {/* Primary CTA */}
              <Button asChild size="lg" className="w-fit">
                <Link href={`/traveler/requests/new?guide=${guideProfile?.user_id ?? id}`}>
                  Написать запрос
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)] space-y-4">
            <p className="font-sans text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground mb-2">Туры гида</p>
            <h2 className="font-display text-[clamp(1.875rem,3.5vw,2.375rem)] font-semibold leading-[1.1]">Авторские маршруты</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <TourCard
                  key={listing.slug}
                  href={`/listings/${listing.slug}`}
                  imageUrl={listing.coverImageUrl}
                  title={listing.title}
                  guide={guide.displayName}
                  rating={guide.reviewsSummary.averageRating}
                  price={listing.priceFromRub ? `от ${new Intl.NumberFormat("ru-RU").format(Math.round(listing.priceFromRub / 1000))} тыс. ₽` : "По запросу"}
                />
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
            <PublicReviewsSection
              title="Что говорят путешественники"
              reviews={reviewItems}
              summary={guide.reviewsSummary}
              emptyText="Пока отзывов нет. Первый отзыв появится после завершённой поездки."
            />
          </div>
        </section>

        {/* Trust signals */}
        <section className="border-t border-border/40 py-8">
          <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {verificationStatus === "approved" ? (
                <span className="flex items-center gap-1.5">
                  <span className="flex size-5 items-center justify-center rounded-full bg-green-500 text-white text-[0.625rem] font-bold">✓</span>
                  Верификация пройдена
                </span>
              ) : null}
              {guideProfile?.years_experience ? (
                <span>На платформе с {new Date().getFullYear() - (guideProfile.years_experience as number)} г.</span>
              ) : null}
              {completedTours > 0 ? (
                <span>{completedTours} завершённых поездок</span>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
