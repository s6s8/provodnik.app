import type { ReactNode } from "react";

import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  title: string;
  subtitle?: string;
  badgeLabel?: string;
  badgeVariant?: React.ComponentProps<typeof Badge>["variant"];
  meta?: Array<{
    icon?: LucideIcon;
    label: string;
  }>;
  highlights?: string;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
};

export function MarketplaceRequestCard({
  title,
  subtitle,
  badgeLabel,
  badgeVariant = "secondary",
  meta,
  highlights,
  footerLeft,
  footerRight,
}: Props) {
  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">{title}</CardTitle>
            {subtitle ? (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {badgeLabel ? (
            <Badge variant={badgeVariant}>{badgeLabel}</Badge>
          ) : null}
        </div>

        {meta?.length ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {meta.map((item, index) => {
              const Icon = item.icon;
              return (
                <span
                  key={`${item.label}-${index}`}
                  className="inline-flex items-center gap-1"
                >
                  {Icon ? <Icon className="size-3.5" /> : null}
                  {item.label}
                  {index < meta.length - 1 ? <span className="px-1">·</span> : null}
                </span>
              );
            })}
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-3">
        {highlights ? (
          <p className="line-clamp-2 text-sm text-foreground">{highlights}</p>
        ) : null}

        {footerLeft || footerRight ? (
          <div className="flex flex-wrap items-end justify-between gap-3">
            {footerLeft ? <div>{footerLeft}</div> : <span />}
            {footerRight ? <div className="shrink-0">{footerRight}</div> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

