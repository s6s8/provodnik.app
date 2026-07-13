import Link from "next/link";

import { RatingDisplay } from "@/components/shared/rating-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type BookingCardProps = {
  listingId: string;
  /** Rendered price headline, e.g. "от 12 000 ₽". */
  priceLabel: string;
  /** Small line under the price, e.g. "на человека". */
  priceNote?: string;
  rating: number;
  reviewCount: number;
  /** Primary CTA copy — "Заказать" / "Заказать тур". */
  primaryLabel: string;
  /** Plain facts (duration, format, group size). */
  facts?: string[];
  /** Assurance bullets shown under the facts. */
  notes?: string[];
  instantBooking?: boolean;
};

/** Sidebar booking card shared by the excursion and tour detail shapes. */
export function BookingCard({
  listingId,
  priceLabel,
  priceNote,
  rating,
  reviewCount,
  primaryLabel,
  facts = [],
  notes = [],
  instantBooking = false,
}: BookingCardProps) {
  return (
    <Card className="bg-surface border border-line shadow-sm rounded-card">
      <CardContent className="space-y-4 p-5">
        <div>
          <p className="text-3xl font-semibold">{priceLabel}</p>
          {priceNote ? <p className="text-sm text-muted-foreground">{priceNote}</p> : null}
          {reviewCount > 0 ? (
            <RatingDisplay rating={rating} reviewCount={reviewCount} className="mt-1" />
          ) : null}
        </div>

        {facts.length > 0 ? (
          <ul className="space-y-1 text-sm text-muted-foreground">
            {facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        ) : null}

        {notes.length > 0 ? (
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        ) : null}

        {instantBooking ? <Badge variant="secondary">Мгновенное бронирование</Badge> : null}

        <div className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href={`/listings/${listingId}/book`}>{primaryLabel}</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/listings/${listingId}/book?tab=question`}>Задать вопрос</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
