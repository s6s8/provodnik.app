import { Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type PublicReviewItem = {
  id: string;
  authorName: string;
  rating: number;
  title?: string | null;
  body?: string | null;
  createdAt: string;
  bookingLabel?: string | null;
};

export type PublicReviewsSummary = {
  averageRating: number;
  totalReviews: number;
  lastReviewAt?: string;
};

function formatDate(iso: string | undefined) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function starCount(value: number) {
  return Array.from({ length: 5 }, (_, index) => index < Math.round(value));
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function PublicReviewsSection({
  title,
  reviews,
  summary,
  emptyText = "Пока нет отзывов.",
  maxItems = 3,
}: {
  title: string;
  reviews: PublicReviewItem[];
  summary?: PublicReviewsSummary;
  emptyText?: string;
  maxItems?: number;
}) {
  const visibleReviews = reviews.slice(0, maxItems);
  const totalSummary =
    summary ??
    (reviews.length > 0
      ? {
          averageRating: Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10,
          totalReviews: reviews.length,
          lastReviewAt: reviews[0]?.createdAt,
        }
      : { averageRating: 0, totalReviews: 0, lastReviewAt: undefined });

  return (
    <Card className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass border-border/50">
      <CardHeader className="space-y-2">
        <CardTitle className="flex flex-wrap items-center justify-between gap-3">
          <span>{title}</span>
          <Badge variant="outline" className="gap-1">
            <Star className="size-3 fill-current" />
            {totalSummary.totalReviews > 0 ? totalSummary.averageRating.toFixed(1) : "0.0"} · {totalSummary.totalReviews}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Последний отзыв: {formatDate(totalSummary.lastReviewAt)} · Отзывы от путешественников.
        </p>
      </CardHeader>
      <CardContent className="grid gap-3">
        {visibleReviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          visibleReviews.map((review) => (
            <article
              key={review.id}
              className="rounded-card border border-border/60 bg-background/70 p-4 shadow-card"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                  {initials(review.authorName) || "П"}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-medium text-foreground">{review.authorName}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(review.createdAt)}</span>
                        {review.bookingLabel ? (
                          <>
                            <span>·</span>
                            <span>{review.bookingLabel}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {starCount(review.rating).map((filled, index) => (
                        <Star
                          key={`${review.id}-${index}`}
                          className={filled ? "size-4 fill-current" : "size-4 text-muted-foreground/30"}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {review.title ? <p className="text-sm font-medium text-foreground">{review.title}</p> : null}
                    {review.body ? <p className="text-sm leading-6 text-muted-foreground">{review.body}</p> : null}
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </CardContent>
    </Card>
  );
}
