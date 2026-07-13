import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatRubNumber } from "@/data/money";
import type { ListingTourDepartureRow } from "@/lib/supabase/types";

function formatRub(minor: number): string {
  return formatRubNumber(Math.round(minor / 100));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function diffDays(start: string, end: string): number {
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24)) + 1;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active")
    return <Badge className="bg-success/10 text-success border-success/30">Свободны места</Badge>;
  if (status === "sold_out")
    return <Badge className="bg-warning/10 text-warning border-warning/30">Мест нет</Badge>;
  return <Badge variant="secondary" className="text-muted-foreground">Отменено</Badge>;
}

export function TourDeparturesList({
  departures,
}: {
  departures: ListingTourDepartureRow[];
}) {
  if (departures.length === 0) {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Даты отправления</h2>
        <p className="text-sm text-muted-foreground">
          Нет доступных дат — запросите индивидуальный тур
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight">Даты отправления</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {departures.map((dep) => {
          const duration = diffDays(dep.start_date, dep.end_date);
          const cur = dep.currency === "RUB" ? "₽" : dep.currency;
          const bookHref = `/listings/${dep.listing_id}/book?departure=${dep.id}`;

          return (
            <Card
              key={dep.id}
              className="bg-surface border border-line shadow-sm rounded-card"
            >
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {formatDate(dep.start_date)} — {formatDate(dep.end_date)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {duration} {duration === 1 ? "день" : duration < 5 ? "дня" : "дней"} · до{" "}
                      {dep.max_persons} чел.
                    </p>
                  </div>
                  <StatusBadge status={dep.status} />
                </div>
                <p className="text-xl font-semibold">
                  от {formatRub(dep.price_minor)} {cur}
                </p>
                {dep.status === "active" ? (
                  <Button asChild className="w-full" size="sm">
                    <Link href={bookHref}>Забронировать</Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
