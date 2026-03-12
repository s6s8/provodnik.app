import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicListing } from "@/data/public-listings/types";

function formatRub(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

export function PublicListingCard({ listing }: { listing: PublicListing }) {
  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant="secondary">
            {listing.city} · {listing.durationDays} day
            {listing.durationDays === 1 ? "" : "s"}
          </Badge>
          <Badge variant="outline">Up to {listing.groupSizeMax}</Badge>
        </div>
        <CardTitle className="text-base leading-snug sm:text-lg">
          <Link
            href={`/listings/${listing.slug}`}
            className="underline-offset-4 hover:underline"
          >
            {listing.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {listing.themes.map((theme) => (
            <Badge key={theme} variant="outline">
              {theme}
            </Badge>
          ))}
        </div>

        <ul className="grid gap-2 text-sm text-muted-foreground">
          {listing.highlights.slice(0, 3).map((highlight) => (
            <li key={highlight} className="flex items-start gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/70" />
              <span className="min-w-0">{highlight}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">From</p>
            <p className="text-base font-semibold tracking-tight text-foreground">
              {formatRub(listing.priceFromRub)}
            </p>
          </div>
          <Button asChild>
            <Link href={`/listings/${listing.slug}`}>View details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

