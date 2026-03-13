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
          <span>Отзывы</span>
          <Badge variant="outline" className="gap-1">
            <TrendingUp className="size-3" />
            Макет
          </Badge>
        </CardTitle>
        <CardDescription>
          Краткое резюме по отзывам на публичном профиле гида. Полный блок с отзывами появится позже.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
            <div className="flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Star className="size-4" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Средняя оценка</p>
              <p className="text-lg font-semibold">
                {summary.averageRating.toFixed(1)}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
            <p className="text-sm text-muted-foreground">Всего отзывов</p>
            <p className="text-lg font-semibold">{summary.totalReviews}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
            <p className="text-sm text-muted-foreground">Последний отзыв</p>
            <p className="text-lg font-semibold">
              {summary.lastReviewAt ?? "-"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
          Здесь появится распределение оценок и отдельные отзывы. Сейчас блок фиксирует место под социальные сигналы и доверие к гиду.
        </div>
      </CardContent>
    </Card>
  );
}

