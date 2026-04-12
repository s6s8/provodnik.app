"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReviewCard } from "@/features/reviews/components/ReviewCard";
import type {
  ReviewRatingsBreakdownRow,
  ReviewReplyRow,
  ReviewRow,
} from "@/lib/supabase/types";

export type ReviewsListProps = {
  reviews: (ReviewRow & {
    breakdown: ReviewRatingsBreakdownRow[];
    reply: ReviewReplyRow | null;
  })[];
  showReplyComposer?: boolean;
};

type Bucket = "all" | "positive" | "critical";

export function ReviewsList({ reviews, showReplyComposer }: ReviewsListProps) {
  const [bucket, setBucket] = React.useState<Bucket>("all");

  const counts = React.useMemo(() => {
    let positive = 0;
    let critical = 0;
    for (const r of reviews) {
      if (r.rating >= 4) positive += 1;
      if (r.rating <= 3) critical += 1;
    }
    return { all: reviews.length, positive, critical };
  }, [reviews]);

  const visible = React.useMemo(() => {
    if (bucket === "positive") return reviews.filter((r) => r.rating >= 4);
    if (bucket === "critical") return reviews.filter((r) => r.rating <= 3);
    return reviews;
  }, [reviews, bucket]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={bucket === "all" ? "default" : "outline"}
          size="sm"
          className="gap-2"
          onClick={() => setBucket("all")}
        >
          Все
          <Badge variant="secondary" className="tabular-nums">
            {counts.all}
          </Badge>
        </Button>
        <Button
          type="button"
          variant={bucket === "positive" ? "default" : "outline"}
          size="sm"
          className="gap-2"
          onClick={() => setBucket("positive")}
        >
          Положительные (4–5 ★)
          <Badge variant="secondary" className="tabular-nums">
            {counts.positive}
          </Badge>
        </Button>
        <Button
          type="button"
          variant={bucket === "critical" ? "default" : "outline"}
          size="sm"
          className="gap-2"
          onClick={() => setBucket("critical")}
        >
          Критические (1–3 ★)
          <Badge variant="secondary" className="tabular-nums">
            {counts.critical}
          </Badge>
        </Button>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">Нет отзывов в этой категории.</p>
      ) : (
        <ul className="space-y-4">
          {visible.map((item) => (
            <li key={item.id}>
              <ReviewCard
                review={item}
                breakdown={item.breakdown}
                reply={item.reply}
                showReplyComposer={showReplyComposer}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
