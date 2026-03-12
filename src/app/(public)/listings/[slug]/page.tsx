import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSeededPublicGuide } from "@/data/public-guides/seed";
import { PublicGuideReviewsSummary } from "@/features/guide/components/public/public-guide-reviews-summary";
import { PublicGuideTrustMarkers } from "@/features/guide/components/public/public-guide-trust-markers";
import { getSeededPublicListing } from "@/data/public-listings/seed";

function formatRub(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const listing = getSeededPublicListing(params.slug);
  if (!listing) return { title: "Listing not found" };

  return {
    title: `${listing.title} - Listing`,
    description: `Seeded itinerary for ${listing.city}, ${listing.region}.`,
  };
}

export default function PublicListingDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const listing = getSeededPublicListing(params.slug);
  if (!listing) notFound();

  const guide = getSeededPublicGuide(listing.guideSlug);
  if (!guide) notFound();

  const totalHours = listing.itinerary.reduce(
    (sum, item) => sum + item.durationHours,
    0,
  );

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {listing.city} · {listing.durationDays} day
            {listing.durationDays === 1 ? "" : "s"}
          </Badge>
          <Badge variant="outline">Up to {listing.groupSizeMax}</Badge>
          <Badge variant="outline">From {formatRub(listing.priceFromRub)}</Badge>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {listing.title}
        </h1>

        <p className="max-w-prose text-sm text-muted-foreground">
          A seeded detail baseline: itinerary summary, inclusions, trust framing,
          and a request-first booking CTA.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="space-y-2">
            <CardTitle>Itinerary summary</CardTitle>
            <CardDescription>
              {listing.durationDays} day{listing.durationDays === 1 ? "" : "s"} ·{" "}
              ~{totalHours.toFixed(1)} active hours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {listing.themes.map((theme) => (
                <Badge key={theme} variant="outline">
                  {theme}
                </Badge>
              ))}
            </div>

            <ol className="grid gap-3">
              {listing.itinerary.map((item, index) => (
                <li
                  key={item.title}
                  className="rounded-2xl border border-border/60 bg-background/70 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        <span className="text-muted-foreground">
                          {index + 1}.
                        </span>{" "}
                        {item.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {item.durationHours}h
                    </Badge>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="border-border/70 bg-card/80">
            <CardHeader className="space-y-2">
              <CardTitle className="text-base">Inclusions</CardTitle>
              <CardDescription>What’s included in this baseline.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {listing.inclusions.map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/80">
            <CardHeader className="space-y-2">
              <CardTitle className="text-base">Your guide</CardTitle>
              <CardDescription>
                Trust framing reuses the public guide seed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between gap-4 rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {guide.displayName}
                  </p>
                  <p className="text-sm text-muted-foreground">{guide.headline}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/guides/${guide.slug}`}>View profile</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <PublicGuideTrustMarkers trustMarkers={guide.trustMarkers} />
            <PublicGuideReviewsSummary summary={guide.reviewsSummary} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">Highlights</CardTitle>
            <CardDescription>What travelers usually care about.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {listing.highlights.map((highlight) => (
              <div
                key={highlight}
                className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/70 p-4"
              >
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/70" />
                <p className="text-sm text-muted-foreground">{highlight}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80 lg:sticky lg:top-24">
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">Request-first booking</CardTitle>
            <CardDescription>
              In the MVP baseline, you start with a short request.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <p className="text-sm font-medium text-foreground">
                From {formatRub(listing.priceFromRub)}
              </p>
              <p className="text-sm text-muted-foreground">
                Price varies by date, group size, and logistics.
              </p>
            </div>
            <Button className="w-full" asChild>
              <Link href="/traveler">Start booking request</Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              By continuing, you acknowledge the{" "}
              <Link href="/policies/cancellation" className="underline underline-offset-4">
                cancellation
              </Link>{" "}
              and{" "}
              <Link href="/policies/refunds" className="underline underline-offset-4">
                refund
              </Link>{" "}
              policies. This CTA links to the traveler area placeholder for now.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

