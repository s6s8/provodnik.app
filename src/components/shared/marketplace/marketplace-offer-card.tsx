import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  guideName: string;
  guideMeta?: string;
  statusLabel?: string;
  priceLabel: string;
  durationLabel?: string;
  highlights?: string[];
  included?: string[];
  message?: string;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
};

export function MarketplaceOfferCard({
  guideName,
  guideMeta,
  statusLabel,
  priceLabel,
  durationLabel,
  highlights,
  included,
  message,
  footerLeft,
  footerRight,
}: Props) {
  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">{guideName}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {[guideMeta, durationLabel].filter(Boolean).join(" · ")}
            </p>
          </div>
          {statusLabel ? <Badge variant="secondary">{statusLabel}</Badge> : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="bg-background/60 text-foreground">
            {priceLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {highlights?.length ? (
          <ul className="grid gap-1 text-sm text-foreground">
            {highlights.slice(0, 3).map((item) => (
              <li key={item} className="line-clamp-1">
                {item}
              </li>
            ))}
          </ul>
        ) : null}

        {included?.length ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Included
            </p>
            <div className="flex flex-wrap gap-2">
              {included.slice(0, 4).map((item) => (
                <Badge key={item} variant="outline" className="bg-background/60">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {message ? (
          <p className="line-clamp-3 text-sm leading-7 text-muted-foreground">
            {message}
          </p>
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

