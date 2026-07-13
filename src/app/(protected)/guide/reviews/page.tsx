import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ReviewsList } from "@/features/reviews/components/ReviewsList";
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
  let items: (ReviewRow & {
    breakdown: ReviewRatingsBreakdownRow[];
    reply: ReviewReplyRow | null;
  })[] = [];
  let loadFailed = false;

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
    loadFailed = true;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Кабинет гида"
        title="Отзывы"
        subtitle="Отзывы путешественников о ваших экскурсиях"
      />
      {loadFailed ? (
        <Alert variant="destructive">
          <AlertDescription>Не удалось загрузить отзывы</AlertDescription>
        </Alert>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="size-6" />}
          title="Отзывов пока нет"
          description="Они появятся после первых завершённых поездок"
          action={
            <Button asChild variant="outline">
              <Link href="/guide/bookings">К моим бронированиям</Link>
            </Button>
          }
        />
      ) : (
        <ReviewsList reviews={items} showReplyComposer />
      )}
    </div>
  );
}
