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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { pluralize } from "@/lib/utils";

const TITLE_MAX = 100;
const BODY_MAX = 2000;

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
  const [fieldErrors, setFieldErrors] = React.useState<{
    title?: string;
    body?: string;
  }>({});
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
          <div className="flex items-start gap-3 rounded-card border border-border/60 bg-background/70 p-4">
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
              const title = String(fd.get("title") ?? "").trim();
              const body = String(fd.get("body") ?? "").trim();
              const nextErrors: { title?: string; body?: string } = {};
              if (title.length > TITLE_MAX) {
                nextErrors.title = `Не длиннее ${TITLE_MAX} символов`;
              }
              if (body.length > BODY_MAX) {
                nextErrors.body = `Не длиннее ${BODY_MAX} символов`;
              }
              setFieldErrors(nextErrors);
              if (nextErrors.title || nextErrors.body) return;

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
                    aria-label={`${value} ${pluralize(value, "звезда", "звезды", "звёзд")}`}
                    onClick={() => setRating(value)}
                    className="flex size-11 items-center justify-center rounded-md transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Star
                      className={
                        value <= rating
                          ? "size-7 fill-gold text-gold"
                          : "size-7 text-muted-foreground"
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 border-t border-border/40 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="title" className="text-foreground">
                  Заголовок (необязательно)
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Например: спокойный темп и хорошая организация"
                  aria-invalid={Boolean(fieldErrors.title)}
                  aria-describedby={fieldErrors.title ? "title-error" : undefined}
                />
                {fieldErrors.title ? (
                  <p id="title-error" role="alert" className="text-sm text-destructive">
                    {fieldErrors.title}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="body" className="text-foreground">
                  Отзыв (необязательно)
                </Label>
                <Textarea
                  id="body"
                  name="body"
                  placeholder="Расскажите, что особенно понравилось и что можно улучшить."
                  aria-invalid={Boolean(fieldErrors.body)}
                  aria-describedby={fieldErrors.body ? "body-error" : undefined}
                />
                {fieldErrors.body ? (
                  <p id="body-error" role="alert" className="text-sm text-destructive">
                    {fieldErrors.body}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Отзыв отправится только после проверки права на публикацию.
              </p>
              <Button type="submit" loading={isPending}>
                Отправить отзыв
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
