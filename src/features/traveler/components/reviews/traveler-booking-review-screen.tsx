"use client";

import * as React from "react";
import { useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Star } from "lucide-react";

import { ProfileAvatar } from "@/components/profile-avatar";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
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
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="-ml-3 px-3">
        <Link href={`/bookings/${booking.id}`}>
          <ArrowLeft className="size-4" />
          Вернуться к поездке
        </Link>
      </Button>

      <PageHeader
        eyebrow="Кабинет путешественника"
        title="Оставить отзыв"
        subtitle="Короткий и конкретный отзыв помогает другим путешественникам выбрать поездку и лучше понимать, чего ожидать."
      />

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Не удалось отправить отзыв</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
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
            <ProfileAvatar
              profile={{
                full_name: booking.guideName,
                avatar_url: booking.guideAvatarUrl,
              }}
              size={48}
            />
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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startTransition(() => {
                void action(fd);
              });
            }}
            className="grid gap-5"
          >
            <input type="hidden" name="rating" value={rating} />

            <div className="grid gap-2">
              <p className="text-sm font-medium text-foreground">
                Оценка <span className="text-destructive">*</span>
              </p>
              <div role="radiogroup" aria-label="Оценка" className="flex flex-wrap gap-1">
                {([1, 2, 3, 4, 5] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} звезд`}
                    onClick={() => setRating(value)}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Star
                      className={
                        value <= rating
                          ? "size-7 fill-amber-400 text-amber-400"
                          : "size-7 text-muted-foreground/40"
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 border-t border-border/40 pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Необязательно
              </p>

              <div className="grid gap-2">
                <label htmlFor="title" className="text-sm text-muted-foreground">
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
                <label htmlFor="body" className="text-sm text-muted-foreground">
                  Отзыв
                </label>
                <Textarea
                  id="body"
                  name="body"
                  maxLength={2000}
                  placeholder="Расскажите, что особенно понравилось и что можно улучшить."
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Отзыв отправится только после проверки права на публикацию.
              </p>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Отправляю..." : "Отправить отзыв"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
