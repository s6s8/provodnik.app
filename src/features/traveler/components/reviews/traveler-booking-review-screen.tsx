"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, Star } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { createReviewInSupabase } from "@/data/reviews/supabase-client";
import type { ReviewRecord, ReviewTargetType } from "@/data/reviews/types";
import {
  reviewSubmissionSchema,
  type ReviewSubmission,
} from "@/data/reviews/schema";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getUserBookings, type BookingRecord } from "@/data/supabase/queries";
import { recordMarketplaceEventFromClient } from "@/data/marketplace-events/client";
import { cn } from "@/lib/utils";

type ReviewFormValues = ReviewSubmission;

function buildReviewId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `rev_local_${crypto.randomUUID()}`;
  }
  return `rev_local_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`;
}

function featuredTargetsForBooking(_record: BookingRecord): Array<{
  type: ReviewTargetType;
  slug: string;
  label: string;
}> {
  // With the simplified BookingRecord from Supabase queries, guide/listing slugs
  // are not directly available. Return empty for now.
  return [];
}

export function TravelerBookingReviewScreen({ bookingId }: { bookingId: string }) {
  const [record, setRecord] = React.useState<BookingRecord | null>(null);
  const [submitted, setSubmitted] = React.useState<ReviewRecord | null>(null);
  const [persistedToBackend, setPersistedToBackend] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const result = await getUserBookings(supabase, user.id);
        if (cancelled) return;
        const found = result.data?.find((b) => b.id === bookingId) ?? null;
        setRecord(found);
      } catch {
        if (!cancelled) setRecord(null);
      }
    })();
    return () => { cancelled = true; };
  }, [bookingId]);

  const targets = React.useMemo(() => {
    if (!record) return [];
    return featuredTargetsForBooking(record);
  }, [record]);

  const defaultTarget = targets[0];

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSubmissionSchema),
    defaultValues: defaultTarget
      ? {
          targetType: defaultTarget.type,
          targetSlug: defaultTarget.slug,
          rating: 5,
          title: "",
          body: "",
          tags: [],
        }
      : {
          targetType: "guide",
          targetSlug: "",
          rating: 5,
          title: "",
          body: "",
          tags: [],
        },
    mode: "onTouched",
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const rating = useWatch({ control: form.control, name: "rating" });
  const targetType = useWatch({ control: form.control, name: "targetType" });
  const targetSlug = useWatch({ control: form.control, name: "targetSlug" });

  const onSubmit = React.useCallback(
    async (values: ReviewFormValues) => {
      if (!record) return;
      const now = new Date().toISOString();

      let review: ReviewRecord;
      let usedBackend = false;
      try {
        review = await createReviewInSupabase({
          bookingId: record.id,
          targetType: values.targetType,
          targetSlug: values.targetSlug,
          rating: values.rating,
          title: values.title,
          body: values.body,
        });
        usedBackend = true;
      } catch {
        review = {
          id: buildReviewId(),
          createdAt: now,
          author: {
            userId: "usr_local_traveler_you",
            displayName: record.travelerName || "You",
          },
          target: {
            type: values.targetType,
            slug: values.targetSlug,
          },
          rating: values.rating,
          title: values.title,
          body: values.body,
          tags: values.tags?.length ? values.tags : undefined,
        };
      }

      setPersistedToBackend(usedBackend);
      setSubmitted(review);

      void recordMarketplaceEventFromClient({
        scope: "booking",
        requestId: record.id,
        bookingId: record.id,
        disputeId: null,
        actorId: review.author.userId,
        eventType: "review_submitted",
        summary: `Отзыв отправлен для ${values.targetType}:${values.targetSlug}`,
        detail: values.title,
        payload: {
          rating: values.rating,
          tags: values.tags,
        },
      });
    },
    [record],
  );

  if (!record) {
    return (
      <div className="space-y-6">
        <Badge variant="outline">Кабинет путешественника</Badge>
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-2">
            <CardTitle>Бронирование не найдено</CardTitle>
            <p className="text-sm text-muted-foreground">
              На этом устройстве нет поездки с таким идентификатором.
            </p>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary">
              <Link href="/traveler/bookings">
                <ArrowLeft className="size-4" />
                Ко всем поездкам
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (record.status !== "completed") {
    return (
      <div className="space-y-6">
        <Badge variant="outline">Кабинет путешественника</Badge>
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-2">
            <CardTitle>Отзыв пока недоступен</CardTitle>
            <p className="text-sm text-muted-foreground">
              Оставить отзыв можно после завершения поездки.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="secondary">
              <Link href={`/traveler/bookings/${record.id}`}>
                <ArrowLeft className="size-4" />
                Вернуться к поездке
              </Link>
            </Button>
            <Button asChild>
              <Link href="/traveler/bookings">Все поездки</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <Badge variant="outline">Кабинет путешественника</Badge>
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="flex flex-row items-start gap-4 space-y-0">
            <div className="mt-0.5 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CheckCircle2 className="size-5" />
            </div>
            <div className="space-y-1">
              <CardTitle>Отзыв сохранён</CardTitle>
              <p className="text-sm text-muted-foreground">
                {persistedToBackend
                  ? "Отзыв сохранён в вашем аккаунте и не пропадёт при обновлениях или смене устройства."
                  : "Отзыв сейчас хранится только на этом устройстве."}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-1 rounded-lg border border-border/70 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">К чему относится отзыв</p>
              <p className="text-sm font-medium text-foreground">
                {submitted.target.type} · {submitted.target.slug}
              </p>
            </div>
            <div className="grid gap-1 rounded-lg border border-border/70 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">Оценка</p>
              <p className="text-sm font-medium text-foreground">
                {submitted.rating} / 5
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <Link href={`/traveler/bookings/${record.id}`}>
              <ArrowLeft className="size-4" />
              Вернуться к поездке
            </Link>
          </Button>
          {record.guideName ? (
            <Button asChild variant="secondary">
              <Link href="/traveler/bookings">Все поездки</Link>
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Button asChild variant="ghost" className="-ml-3 px-3">
          <Link href={`/traveler/bookings/${record.id}`}>
            <ArrowLeft className="size-4" />
            Поездка
          </Link>
        </Button>
        <div className="space-y-2">
          <Badge variant="outline">Кабинет путешественника</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Оставить отзыв
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Короткий и конкретный отзыв помогает другим путешественникам выбрать поездку.
          </p>
        </div>
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>Детали отзыва</CardTitle>
          <p className="text-sm text-muted-foreground">
            Поездка: {record.destination} · {record.dateLabel}
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {targets.length > 1 ? (
            <div className="grid gap-2">
              <p className="text-sm font-medium text-foreground">К чему оставить отзыв</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                {targets.map((target) => {
                  const isActive =
                    targetType === target.type && targetSlug === target.slug;
                  return (
                    <Button
                      key={`${target.type}:${target.slug}`}
                      type="button"
                      variant={isActive ? "default" : "secondary"}
                      className="justify-start"
                      onClick={() => {
                        setValue("targetType", target.type, { shouldValidate: true });
                        setValue("targetSlug", target.slug, { shouldValidate: true });
                      }}
                    >
                      {target.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <Separator />

          <form
            className="grid gap-5"
            onSubmit={handleSubmit(onSubmit)}
            aria-label="Отправить отзыв путешественника"
          >
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
                      onClick={() => setValue("rating", value, { shouldValidate: true })}
                      aria-pressed={active}
                      className="gap-2"
                    >
                      <Star className={cn("size-4", active ? "text-primary-foreground" : "")} />
                      {value}
                    </Button>
                  );
                })}
              </div>
              {errors.rating?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {errors.rating.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium text-foreground">
                Заголовок
              </label>
              <Input
                id="title"
                placeholder="Например: чёткий темп и организация"
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? "title-error" : undefined}
                {...register("title")}
              />
              {errors.title?.message ? (
                <p id="title-error" className="text-xs font-medium text-destructive">
                  {errors.title.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <label htmlFor="body" className="text-sm font-medium text-foreground">
                Что понравилось, а что можно улучшить?
              </label>
              <Textarea
                id="body"
                placeholder="Напишите по делу: маршрут, темп, безопасность, организация, общение…"
                aria-invalid={Boolean(errors.body)}
                aria-describedby={errors.body ? "body-error" : undefined}
                {...register("body")}
              />
              {errors.body?.message ? (
                <p id="body-error" className="text-xs font-medium text-destructive">
                  {errors.body.message}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Не указывайте телефоны и личные данные.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {errors.targetSlug?.message ? (
                  <span className="text-destructive">{errors.targetSlug.message}</span>
                ) : null}
              </p>
              <Button type="submit" disabled={isSubmitting}>
                Сохранить отзыв
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

