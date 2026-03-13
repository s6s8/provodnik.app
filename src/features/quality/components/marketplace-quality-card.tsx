import { Activity, Gauge, ShieldAlert, TimerReset } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MarketplaceQualitySnapshot } from "@/data/quality/seed";

function formatResponseTime(hours: number) {
  if (hours < 1) return `${Math.round(hours * 60)} мин`;
  return `${hours.toFixed(1)} ч`;
}

function tierVariant(tier: MarketplaceQualitySnapshot["tier"]) {
  switch (tier) {
    case "strong":
      return "secondary" as const;
    case "watch":
      return "outline" as const;
    case "risk":
      return "destructive" as const;
  }
}

export function MarketplaceQualityCard({
  title,
  description,
  snapshot,
}: {
  title: string;
  description: string;
  snapshot: MarketplaceQualitySnapshot;
}) {
  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center justify-between gap-3">
          <span>{title}</span>
          <Badge variant={tierVariant(snapshot.tier)}>{snapshot.visibilityLabel}</Badge>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricTile
            icon={<TimerReset className="size-4" />}
            label="Ответ"
            value={formatResponseTime(snapshot.responseTimeHours)}
            helper="Среднее время ответа"
          />
          <MetricTile
            icon={<Gauge className="size-4" />}
            label="Завершение"
            value={`${snapshot.completionRate}%`}
            helper="Завершённые поездки"
          />
          <MetricTile
            icon={<Activity className="size-4" />}
            label="Отмена"
            value={`${snapshot.cancellationRate}%`}
            helper="Отменённые поездки"
          />
        </div>

        <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <ShieldAlert className="size-4" />
            Логика видимости
          </div>
          <p className="text-sm text-muted-foreground">{snapshot.visibilityNote}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricTile({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-lg font-semibold tracking-tight text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{helper}</div>
    </div>
  );
}
