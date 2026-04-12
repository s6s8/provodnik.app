import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ReplyComposer } from "@/features/reviews/components/ReplyComposer";
import { maskPii } from "@/lib/pii/mask";
import type {
  ReviewRatingsBreakdownRow,
  ReviewReplyRow,
  ReviewRow,
} from "@/lib/supabase/types";

const AXIS_LABELS: Record<string, string> = {
  material: "Материал",
  engagement: "Вовлечённость",
  knowledge: "Знания гида",
  route: "Маршрут",
};

const AXIS_ORDER = ["material", "engagement", "knowledge", "route"] as const;

export type ReviewCardProps = {
  review: ReviewRow;
  breakdown: ReviewRatingsBreakdownRow[];
  reply: ReviewReplyRow | null;
  showReplyComposer?: boolean;
};

function Stars({ n }: { n: number }) {
  const clamped = Math.min(5, Math.max(0, Math.round(n)));
  return (
    <span>{Array.from({ length: 5 }, (_, i) => (i < clamped ? "★" : "☆")).join("")}</span>
  );
}

export function ReviewCard({
  review,
  breakdown,
  reply,
  showReplyComposer = false,
}: ReviewCardProps) {
  const byAxis = new Map(breakdown.map((row) => [row.axis, row.score]));

  const showInlinePublishedReply =
    reply?.status === "published" && !showReplyComposer;

  return (
    <Card className="border-border/70">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-lg text-foreground">
            <Stars n={review.rating} />
          </div>
          <time className="text-sm text-muted-foreground" dateTime={review.created_at}>
            {new Date(review.created_at).toLocaleDateString("ru-RU")}
          </time>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {review.body ? (
          <p className="whitespace-pre-wrap text-sm text-foreground">{maskPii(review.body)}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Без текста</p>
        )}

        <div className="grid gap-1 text-sm text-foreground sm:grid-cols-2">
          {AXIS_ORDER.map((axis) => (
            <div key={axis} className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">{AXIS_LABELS[axis]}:</span>
              <Stars n={byAxis.get(axis) ?? 0} />
            </div>
          ))}
        </div>

        {showInlinePublishedReply ? (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Ответ гида:</p>
              <p className="whitespace-pre-wrap text-sm text-foreground">{reply.body}</p>
            </div>
          </>
        ) : null}

        {showReplyComposer ? (
          <>
            <Separator />
            <ReplyComposer reviewId={review.id} existingReply={reply} />
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
