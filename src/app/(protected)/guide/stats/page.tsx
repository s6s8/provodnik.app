import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { StatTile } from "@/components/shared/stat-tile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Статистика",
};

type Stat = {
  label: string;
  value: string;
  helper: string;
};

export default async function GuideStatsPage() {
  let stats: Stat[] | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/auth?next=/guide/stats");
    }

    const guideId = user.id;

    const [completedBookings, publishedReviews, activeListings] = await Promise.all([
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("guide_id", guideId)
        .eq("status", "completed"),
      supabase
        .from("reviews")
        .select("rating")
        .eq("guide_id", guideId)
        .eq("status", "published"),
      supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("guide_id", guideId)
        .eq("status", "published"),
    ]);

    const ratings = (publishedReviews.data ?? []).map((r) => r.rating);
    const reviewCount = ratings.length;
    const averageRating =
      reviewCount > 0
        ? (ratings.reduce((sum, value) => sum + value, 0) / reviewCount).toFixed(1)
        : "—";

    stats = [
      {
        label: "Завершённые экскурсии",
        value: String(completedBookings.count ?? 0),
        helper: "Проведённые брони",
      },
      {
        label: "Средняя оценка",
        value: averageRating,
        helper: "По опубликованным отзывам",
      },
      {
        label: "Отзывов",
        value: String(reviewCount),
        helper: "Опубликованных",
      },
      {
        label: "Активных экскурсий",
        value: String(activeListings.count ?? 0),
        helper: "Опубликованные объявления",
      },
    ];
  } catch {
    return (
      <PageHeader
        eyebrow="Кабинет гида"
        title="Статистика"
        subtitle="Раздел временно недоступен. Напишите в поддержку."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Кабинет гида"
        title="Статистика"
        subtitle="Ключевые показатели по вашим экскурсиям, бронированиям и отзывам."
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatTile
            key={stat.label}
            label={stat.label}
            value={stat.value}
            hint={stat.helper}
          />
        ))}
      </div>
    </div>
  );
}
