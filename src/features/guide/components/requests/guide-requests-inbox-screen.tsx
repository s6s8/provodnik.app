import Link from "next/link";

import type { TravelerRequestRecord } from "@/data/traveler-request/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatExperienceType(value: string): string {
  switch (value) {
    case "city":
      return "City";
    case "nature":
      return "Nature";
    case "culture":
      return "Culture";
    case "food":
      return "Food";
    case "adventure":
      return "Adventure";
    case "relax":
      return "Relax";
    default:
      return value;
  }
}

export function GuideRequestsInboxScreen({
  items,
}: {
  items: TravelerRequestRecord[];
}) {
  const sorted = [...items].sort((a, b) =>
    (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt),
  );

  const summary = {
    total: sorted.length,
    highBudget:
      sorted.filter((item) => item.request.budgetPerPersonRub >= 15000).length,
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge variant="outline">Кабинет гида</Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Входящие запросы
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            Здесь появляются запросы путешественников. Открывайте карточку запроса,
            чтобы разобрать задачу и собрать предложение под бюджет гостя.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="secondary">
            <Link href="/guide/bookings">Бронирования</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/guide/listings">Мои программы</Link>
          </Button>
        </div>
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>Сводка по запросам</CardTitle>
          <p className="text-sm text-muted-foreground">
            Сколько запросов сейчас в очереди и сколько из них с высоким бюджетом.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border/70 bg-background/60 p-3">
            <p className="text-xs text-muted-foreground">Всего запросов</p>
            <p className="mt-1 text-base font-semibold text-foreground">
              {summary.total}
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background/60 p-3">
            <p className="text-xs text-muted-foreground">Бюджет от 15 000 ₽</p>
            <p className="mt-1 text-base font-semibold text-foreground">
              {summary.highBudget}
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background/60 p-3">
            <p className="text-xs text-muted-foreground">Готовы к разбору</p>
            <p className="mt-1 text-base font-semibold text-foreground">
              {summary.total}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>Входящие запросы</CardTitle>
          <p className="text-sm text-muted-foreground">
            {sorted.length} запрос
            {sorted.length === 1
              ? ""
              : sorted.length > 1 && sorted.length < 5
                ? "а"
                : "ов"}
            .
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Пока нет новых запросов от путешественников.
            </p>
          ) : (
            <div className="space-y-3">
              {sorted.map((item, index) => (
                <div key={item.id} className="space-y-3">
                  <Link
                    href={`/guide/requests/${item.id}`}
                    className="block rounded-xl border border-border/70 bg-background/60 p-4 transition-colors hover:bg-background"
                    aria-label={`Открыть запрос ${item.request.destination}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          Запрос: {item.request.destination}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatExperienceType(item.request.experienceType)} в{" "}
                          <span className="font-medium text-foreground">
                            {item.request.destination}
                          </span>
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(item.updatedAt || item.createdAt)}
                      </p>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                      <p>
                        <span className="font-medium text-foreground">Даты:</span>{" "}
                        {item.request.startDate} to {item.request.endDate}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Группа:</span>{" "}
                        {item.request.groupSize} · {item.request.groupPreference}
                      </p>
                      <p className="sm:col-span-2">
                        <span className="font-medium text-foreground">Бюджет:</span>{" "}
                        ₽{" "}
                        {item.request.budgetPerPersonRub.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}{" "}
                        на человека
                      </p>
                    </div>

                    {item.request.notes ? (
                      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                        {item.request.notes}
                      </p>
                    ) : null}
                  </Link>

                  {index < sorted.length - 1 ? <Separator /> : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

