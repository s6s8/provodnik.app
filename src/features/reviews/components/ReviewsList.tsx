"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <div className="flex flex-col gap-6">
      <Tabs
        defaultValue="all"
        value={bucket}
        onValueChange={(value) => setBucket(value as Bucket)}
      >
        <TabsList>
          <TabsTrigger value="all" className="min-h-11 gap-2">
            Все
            <Badge variant="secondary" className="tabular-nums">
              {counts.all}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="positive" className="min-h-11 gap-2">
            Положительные
            <Badge variant="secondary" className="tabular-nums">
              {counts.positive}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="critical" className="min-h-11 gap-2">
            Критические
            <Badge variant="secondary" className="tabular-nums">
              {counts.critical}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">Нет отзывов в этой категории.</p>
      ) : (
        <ul className="flex flex-col gap-4">
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
