import { KpiCard } from "@/features/guide/components/dashboard/KpiCard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GuideDashboardKpiViewRow, GuideProfileRow } from "@/lib/supabase/types";

type GuideProfileKpiPick = Pick<
  GuideProfileRow,
  "average_rating" | "response_rate" | "review_count"
>;

interface Props {
  userId: string;
}

export async function KpiStrip({ userId }: Props) {
  let kpi: GuideDashboardKpiViewRow | null = null;
  let profile: GuideProfileKpiPick | null = null;

  try {
    const supabase = await createSupabaseServerClient();

    const kpiRes = await supabase
      .from("v_guide_dashboard_kpi")
      .select("*")
      .eq("guide_id", userId)
      .maybeSingle();

    if (!kpiRes.error && kpiRes.data) {
      kpi = kpiRes.data;
    }

    const profileRes = await supabase
      .from("guide_profiles")
      .select("average_rating, response_rate, review_count")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profileRes.error && profileRes.data) {
      profile = profileRes.data;
    }
  } catch {
    // Missing Supabase env, view absent, or network — show placeholders; never throw.
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      <KpiCard label="Просмотры" value={kpi?.views_30d ?? "–"} subtext="за 30 дней" />
      <KpiCard label="Заявки" value={kpi?.requests_30d ?? "–"} subtext="за 30 дней" />
      <KpiCard label="Предложения" value={kpi?.offers_sent_30d ?? "–"} subtext="за 30 дней" />
      <KpiCard label="Бронирования" value={kpi?.bookings_30d ?? "–"} subtext="за 30 дней" />
      <KpiCard
        label="Рейтинг"
        value={profile?.average_rating?.toFixed(1) ?? "–"}
        subtext={`${profile?.review_count ?? 0} отзывов`}
      />
      <KpiCard
        label="Ответы"
        value={`${Math.round((profile?.response_rate ?? 0) * 100)}%`}
        subtext="скорость ответа"
      />
    </div>
  );
}
