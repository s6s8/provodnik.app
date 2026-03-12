import { Star, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PublicGuideReviewsSummary } from "@/data/public-guides/types";

export function PublicGuideReviewsSummary({
  summary,
}: {
  summary: PublicGuideReviewsSummary;
}) {
  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center justify-between gap-3">
          <span>Reviews</span>
          <Badge variant="outline" className="gap-1">
            <TrendingUp className="size-3" />
            Placeholder
          </Badge>
        </CardTitle>
        <CardDescription>
          Summary view for the public guide profile. Full reviews will land later
          in the marketplace loop.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
            <div className="flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Star className="size-4" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average rating</p>
              <p className="text-lg font-semibold">
                {summary.averageRating.toFixed(1)}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
            <p className="text-sm text-muted-foreground">Total reviews</p>
            <p className="text-lg font-semibold">{summary.totalReviews}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
            <p className="text-sm text-muted-foreground">Latest review</p>
            <p className="text-lg font-semibold">
              {summary.lastReviewAt ?? "-"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
          Rating distribution and individual reviews will be rendered here. For
          now, this placeholder ensures the profile surface reserves space for
          social proof and trust.
        </div>
      </CardContent>
    </Card>
  );
}

