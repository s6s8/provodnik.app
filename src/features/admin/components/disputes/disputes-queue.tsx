import Link from "next/link";
import { AlertTriangle, Clock, Snowflake, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DisputeListItem } from "@/lib/supabase/disputes";

function formatAt(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRub(minor: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

function statusBadge(status: DisputeListItem["status"]) {
  switch (status) {
    case "open":
      return { label: "Открыт", variant: "default" as const, Icon: Clock };
    case "under_review":
      return { label: "В работе", variant: "secondary" as const, Icon: AlertTriangle };
    case "resolved":
      return { label: "Решён", variant: "secondary" as const, Icon: ShieldAlert };
    case "closed":
      return { label: "Закрыт", variant: "outline" as const, Icon: Snowflake };
  }
}

export function DisputesQueue({ disputes }: { disputes: DisputeListItem[] }) {
  const counts = disputes.reduce(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    { open: 0, under_review: 0, resolved: 0, closed: 0 } as Record<DisputeListItem["status"], number>,
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="outline">Админ-панель</Badge>
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Споры и возвраты</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Реальные записи из Supabase. Откройте карточку спора, добавьте заметку или завершите разбор.
          </p>
        </div>
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-2">
          <CardTitle className="text-lg">Очередь споров</CardTitle>
          <CardDescription>
            Открыто {counts.open}, в работе {counts.under_review}, решено {counts.resolved}, закрыто {counts.closed}.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {disputes.length === 0 ? (
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="text-lg">Споров нет</CardTitle>
              <CardDescription>Новые обращения появятся здесь автоматически после открытия спора.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          disputes.map((item) => {
            const badge = statusBadge(item.status);
            const booking = item.booking;

            return (
              <Card key={item.id} className="border-border/70 bg-card/90">
                <CardHeader className="space-y-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-lg">
                          {booking?.travelerName ?? "Путешественник"} vs {booking?.guideName ?? "Гид"}
                        </CardTitle>
                        <Badge variant={badge.variant}>
                          <badge.Icon className="mr-1 size-3.5" />
                          {badge.label}
                        </Badge>
                        {item.payoutFrozen ? <Badge variant="destructive">Выплата заморожена</Badge> : null}
                        <Badge variant="outline">{item.id}</Badge>
                      </div>
                      <CardDescription className="flex flex-wrap gap-x-2 gap-y-1">
                        <span>Бронь {booking?.id ?? item.bookingId}</span>
                        <span className="text-muted-foreground/50">·</span>
                        <span>{booking?.listingTitle ?? booking?.destination ?? "Маршрут"}</span>
                        <span className="text-muted-foreground/50">·</span>
                        <span>{booking ? formatRub(booking.subtotalMinor) : "—"}</span>
                      </CardDescription>
                    </div>

                    <Button asChild variant="secondary">
                      <Link href={`/admin/disputes/${item.id}`}>Открыть спор</Link>
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="max-w-4xl text-sm text-foreground">{item.reason}</p>
                  {item.summary ? (
                    <p className="max-w-4xl text-sm text-muted-foreground">{item.summary}</p>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>Создано {formatAt(item.createdAt)}</span>
                    <span>·</span>
                    <span>Обновлено {formatAt(item.updatedAt)}</span>
                    <span>·</span>
                    <span>Текущий статус брони: {booking?.status ?? "—"}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
