import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Card className="border-border/70 bg-card/90">
      <CardContent className="flex flex-col items-center gap-5 py-16 text-center">
        {icon ? (
          <span className="flex size-14 items-center justify-center rounded-full bg-brand/10 text-brand">
            {icon}
          </span>
        ) : null}
        <div className="space-y-1.5">
          <p className="text-base font-semibold text-foreground">{title}</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        {action ? (
          <div className="flex flex-wrap justify-center gap-3">{action}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
