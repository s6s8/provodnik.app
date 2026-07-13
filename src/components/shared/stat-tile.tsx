import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatTileProps = {
  label: string;
  value: ReactNode;
  /** Optional caption under the value (e.g. "за 30 дней"). */
  hint?: ReactNode;
  className?: string;
};

/**
 * One number + its label. Canonical primitive — the guide stats, bookings and
 * calendar summaries and the admin dashboard all render through this.
 */
export function StatTile({ label, value, hint, className }: StatTileProps) {
  return (
    <Card size="sm" className={cn(className)}>
      <CardContent className="flex flex-col gap-1 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-2">
          {label}
        </p>
        <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
