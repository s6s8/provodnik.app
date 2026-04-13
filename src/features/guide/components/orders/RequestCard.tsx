import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { maskPii } from "@/lib/pii/mask";
import type { TravelerRequestRow } from "@/lib/supabase/types";

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatBudget(minor: number, currency: string): string {
  const major = minor / 100;
  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(major);
  } catch {
    return `${major.toFixed(0)} ${currency}`;
  }
}

export function RequestCard({ request }: { request: TravelerRequestRow }) {
  const notesPreview = maskPii(request.notes);
  const threadHref = `/guide/inbox/${request.id}`;

  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">
              {request.destination}
            </p>
            {request.region ? (
              <p className="text-sm text-muted-foreground">{request.region}</p>
            ) : null}
          </div>
          <Badge variant="outline" className="shrink-0">
            {formatDate(request.starts_on)}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span>Участников: {request.participants_count}</span>
          {request.budget_minor != null ? (
            <span>
              Бюджет:{" "}
              {formatBudget(request.budget_minor, request.currency)}
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {notesPreview ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {notesPreview}
          </p>
        ) : null}
        <Button asChild size="sm">
          <Link href={threadHref}>Ответить</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
