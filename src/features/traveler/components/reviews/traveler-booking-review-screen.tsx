"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type BookingReviewDetails = {
  id: string;
  destination: string;
  dateLabel: string;
  guideName: string;
  guideAvatarUrl: string | null;
  guideVerified: boolean;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function TravelerBookingReviewScreen({
  booking,
  action,
  errorMessage,
}: {
  booking: BookingReviewDetails;
  action: (formData: FormData) => void | Promise<void>;
  errorMessage?: string | null;
}) {
  const [rating, setRating] = React.useState<1 | 2 | 3 | 4 | 5>(5);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="-ml-3 px-3">
        <Link href={`/traveler/bookings/${booking.id}`}>
          <ArrowLeft className="size-4" />
          Вернуться к поездке
        </Link>
      </Button>

      <div className="space-y-2">
        <p className="editorial-kicker">Кабинет путешественника</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Оставить отзыв
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Короткий и конкретный отзыв помогает другим путешественникам выбрать
          поездку и лучше понимать, чего ожидать.
        </p>
      </div>

      {errorMessage ? (
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Не удалось отправить отзыв</CardTitle>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
          </CardHeader>
        </Card>
      ) : null}

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>Детали поездки</CardTitle>
          <p className="text-sm text-muted-foreground">
            {booking.destination} · {booking.dateLabel}
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
              {booking.guideAvatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={booking.guideAvatarUrl}
                  alt={booking.guideName}
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold">{getInitials(booking.guideName)}</span>
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-foreground">{booking.guideName}</p>
                {booking.guideVerified ? (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="size-3.5" />
                    Проверен
                  </Badge>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">
                Отзыв появится в профиле гида после отправки.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>Оценка и отзыв</CardTitle>
          <p className="text-sm text-muted-foreground">
            Оцените поездку и оставьте короткий комментарий. Заголовок и текст
            необязательны, но помогают другим гостям.
          </p>
        </CardHeader>
        <CardContent>
          <form action={action} className="grid gap-5">
            <input type="hidden" name="rating" value={rating} />

            <div className="grid gap-2">
              <p className="text-sm font-medium text-foreground">Оценка</p>
              <div className="flex flex-wrap gap-2">
                {([1, 2, 3, 4, 5] as const).map((value) => {
                  const active = rating === value;
                  return (
                    <Button
                      key={value}
                      type="button"
                      variant={active ? "default" : "secondary"}
                      className="gap-2"
                      onClick={() => setRating(value)}
                      aria-pressed={active}
                    >
                      <Star className={active ? "size-4 fill-current" : "size-4"} />
                      {value}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium text-foreground">
                Заголовок
              </label>
              <Input
                id="title"
                name="title"
                maxLength={100}
                placeholder="Например: спокойный темп и хорошая организация"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="body" className="text-sm font-medium text-foreground">
                Отзыв
              </label>
              <Textarea
                id="body"
                name="body"
                maxLength={2000}
                placeholder="Расскажите, что особенно понравилось и что можно улучшить."
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Отзыв отправится только после проверки права на публикацию.
              </p>
              <Button type="submit">Отправить отзыв</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

