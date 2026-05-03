import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { ReviewsList } from "@/features/reviews/components/ReviewsList";
import { flags } from "@/lib/flags";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ReviewRatingsBreakdownRow,
  ReviewReplyRow,
  ReviewRow,
} from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Отзывы",
};

type RawReview = ReviewRow & {
  review_ratings_breakdown: ReviewRatingsBreakdownRow[] | null;
  review_replies: ReviewReplyRow[] | null;
};

function pickReply(rows: ReviewReplyRow[] | null, guideId: string): ReviewReplyRow | null {
  if (!rows?.length) return null;
  const own = rows.find((r) => r.guide_id === guideId);
  return own ?? rows[0] ?? null;
}

function toListItem(raw: RawReview, guideId: string): ReviewRow & {
  breakdown: ReviewRatingsBreakdownRow[];
  reply: ReviewReplyRow | null;
} {
  const {
    review_ratings_breakdown: _b,
    review_replies: _r,
    ...review
  } = raw;
  return {
    ...review,
    breakdown: raw.review_ratings_breakdown ?? [],
    reply: pickReply(raw.review_replies, guideId),
  };
}

export default async function GuideReviewsPage() {
  if (!flags.FEATURE_TR_REPUTATION) {
    redirect("/guide");
  }

  let items: (ReviewRow & {
    breakdown: ReviewRatingsBreakdownRow[];
    reply: ReviewReplyRow | null;
  })[] = [];

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/auth?next=/guide/reviews");
    }

    const guideId = user.id;

    const { data: reviews } = await supabase
      .from("reviews")
      .select("*, review_ratings_breakdown(*), review_replies(*)")
      .eq("guide_id", guideId)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    items = ((reviews ?? []) as RawReview[]).map((row) => toListItem(row, guideId));
  } catch {
    return (
      <div className="space-y-4">
        <Badge variant="outline">Кабинет гида</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Отзывы</h1>
        <p className="text-sm text-muted-foreground">
          Данные недоступны без настроенного Supabase. Проверьте переменные окружения.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="outline">Кабинет гида</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Отзывы</h1>
        <p className="text-sm text-muted-foreground">
          Опубликованные отзывы с оценками по четырём критериям и ответы гида.
        </p>
      </div>
      <ReviewsList reviews={items} showReplyComposer />
    </div>
  );
}
