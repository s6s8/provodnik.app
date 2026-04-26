import { createSupabaseServerClient } from "@/lib/supabase/server";

interface KpiTile {
  label: string;
  value: string;
  highlight?: boolean;
}

async function fetchGuideKpi(guideId: string): Promise<KpiTile[]> {
  const supabase = await createSupabaseServerClient();

  // Fetch from guide_stats or calculate from available data
  // These are real metrics — query what's available
  const { data: stats } = await supabase
    .from("guide_stats")
    .select("*")
    .eq("guide_id", guideId)
    .single();

  if (!stats) {
    return [
      { label: "Отвечаете", value: "—" },
      { label: "Подтверждаете", value: "—" },
      { label: "Конверсия", value: "—" },
      { label: "Заказов", value: "—" },
      { label: "Заработали", value: "—" },
    ];
  }

  return [
    { label: "Отвечаете", value: stats.avg_response_time_min ? `${stats.avg_response_time_min} мин` : "—" },
    { label: "Подтверждаете", value: stats.confirmation_rate ? `${Math.round(stats.confirmation_rate * 100)}%` : "—" },
    { label: "Конверсия", value: stats.conversion_rate ? `${Math.round(stats.conversion_rate * 100)}%` : "—" },
    { label: "Заказов", value: stats.total_orders?.toString() ?? "—" },
    { label: "Заработали", value: stats.total_earned ? `${stats.total_earned.toLocaleString("ru")} ₽` : "—" },
  ];
}

export async function GuideKpiStrip({ guideId }: { guideId: string }) {
  let tiles: KpiTile[];
  try {
    tiles = await fetchGuideKpi(guideId);
  } catch {
    // Fallback if guide_stats table doesn't exist yet — show static strip
    tiles = [
      { label: "Отвечаете", value: "—" },
      { label: "Подтверждаете", value: "—" },
      { label: "Конверсия", value: "—" },
      { label: "Заказов", value: "—" },
      { label: "Заработали", value: "—" },
    ];
  }

  return (
    <div className="w-full border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-0 overflow-x-auto px-6 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tiles.map((tile, i) => (
          <div
            key={tile.label}
            className={`flex shrink-0 flex-col px-4 py-1 ${i < tiles.length - 1 ? "border-r border-border/40" : ""}`}
          >
            <span
              className={`text-xs font-semibold leading-tight ${tile.highlight ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
            >
              {tile.label}
            </span>
            {tile.value ? (
              <span className="text-sm font-medium text-foreground leading-tight">{tile.value}</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
