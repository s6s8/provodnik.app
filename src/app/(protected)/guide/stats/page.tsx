import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { StatTile } from "@/components/shared/stat-tile";
import { Badge } from "@/components/ui/badge";
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
      <div className="space-y-4">
        <Badge variant="outline">Кабинет гида</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Статистика</h1>
        <p className="text-sm text-muted-foreground">
          Раздел временно недоступен. Напишите в поддержку.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="outline">Кабинет гида</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Статистика</h1>
        <p className="text-sm text-muted-foreground">
          Ключевые показатели по вашим экскурсиям, бронированиям и отзывам.
        </p>
      </div>
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
