"use client";

import * as React from "react";
import { Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReviewRecord, ReviewsSummary } from "@/data/reviews/types";
import { getAllReviewsSummaryForTarget, listAllReviewsForTarget } from "@/data/reviews/local-store";

function formatIsoShort(iso: string | undefined) {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function PublicReviewsSection({
  title,
  target,
  initialSummary,
  initialReviews,
  maxItems = 3,
}: {
  title: string;
  target: ReviewRecord["target"];
  initialSummary: ReviewsSummary;
  initialReviews: ReviewRecord[];
  maxItems?: number;
}) {
  const [summary, setSummary] = React.useState<ReviewsSummary>(initialSummary);
  const [items, setItems] = React.useState<ReviewRecord[]>(() =>
    initialReviews.slice(0, maxItems),
  );

  React.useEffect(() => {
    const localSummary = getAllReviewsSummaryForTarget(target.type, target.slug);
    const localItems = listAllReviewsForTarget(target.type, target.slug);
    const merged = new Map<string, ReviewRecord>();

    for (const item of initialReviews) merged.set(item.id, item);
    for (const item of localItems) merged.set(item.id, item);

    const mergedItems = [...merged.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    const total = mergedItems.reduce((sum, item) => sum + item.rating, 0);
    const mergedSummary: ReviewsSummary =
      mergedItems.length > 0
        ? {
            averageRating: Math.round((total / mergedItems.length) * 100) / 100,
            totalReviews: mergedItems.length,
            lastReviewAt: mergedItems[0]?.createdAt,
          }
        : initialSummary.totalReviews > 0
          ? initialSummary
          : localSummary;

    setSummary(mergedSummary);
    setItems(mergedItems.slice(0, maxItems));
  }, [initialReviews, initialSummary, maxItems, target.slug, target.type]);

  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center justify-between gap-3">
          <span>{title}</span>
          <Badge variant="outline" className="gap-1">
            <Star className="size-3" />
            {summary.averageRating.toFixed(1)} · {summary.totalReviews}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Последний отзыв: {formatIsoShort(summary.lastReviewAt)} · Здесь появляются подтверждённые отзывы после завершённых поездок.
        </p>
      </CardHeader>
      <CardContent className="grid gap-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
            Здесь будут отзывы путешественников. После завершения поездки гость может оставить оценку и комментарий в своём кабинете.
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((review) => (
              <ReviewRow key={review.id} review={review} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReviewRow({ review }: { review: ReviewRecord }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-foreground">{review.title}</p>
          <p className="text-sm text-muted-foreground">{review.body}</p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {review.rating} / 5
        </Badge>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{review.author.displayName}</span>
        <span>·</span>
        <span>{formatIsoShort(review.createdAt)}</span>
        {review.tags?.length ? (
          <>
            <span>·</span>
            <span>{review.tags.join(", ")}</span>
          </>
        ) : null}
      </div>
    </div>
  );
}

