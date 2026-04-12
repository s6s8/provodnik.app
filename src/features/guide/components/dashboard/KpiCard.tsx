import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

interface Props {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: "up" | "down" | "neutral";
  icon?: ReactNode;
}

export function KpiCard({ label, value, subtext, trend, icon }: Props) {
  return (
    <Card className="border-border/70 bg-card/90" size="sm">
      <CardContent className="px-4 pt-4 pb-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {icon ? <span className="shrink-0 text-muted-foreground">{icon}</span> : null}
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          {trend === "up" ? (
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-500" aria-hidden>
              ↑
            </span>
          ) : null}
          {trend === "down" ? (
            <span className="text-sm font-medium text-red-600 dark:text-red-500" aria-hidden>
              ↓
            </span>
          ) : null}
        </div>
        {subtext ? <p className="mt-1 text-xs text-muted-foreground/80">{subtext}</p> : null}
      </CardContent>
    </Card>
  );
}
