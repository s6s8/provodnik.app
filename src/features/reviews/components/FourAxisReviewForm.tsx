"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { submitReview } from "@/features/reviews/actions/submitReview";
import { StarRatingInput } from "@/features/reviews/components/StarRatingInput";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const ReviewSchema = z.object({
  overall: z.number().min(1).max(5),
  material: z.number().min(1).max(5),
  engagement: z.number().min(1).max(5),
  knowledge: z.number().min(1).max(5),
  route: z.number().min(1).max(5),
  body: z.string().min(20, "Минимум 20 символов").max(3000),
});

type ReviewFormValues = z.infer<typeof ReviewSchema>;

interface Props {
  bookingId: string;
  guideId: string;
  listingId: string;
  listingTitle: string;
}

export function FourAxisReviewForm({
  bookingId,
  guideId,
  listingId,
  listingTitle,
}: Props) {
  const [success, setSuccess] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(ReviewSchema),
    defaultValues: {
      overall: 5,
      material: 5,
      engagement: 5,
      knowledge: 5,
      route: 5,
      body: "",
    },
    mode: "onTouched",
  });

  const {
    control,
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = form;

  const isLoading = isSubmitting || isPending;

  const onSubmit = React.useCallback(
    (values: ReviewFormValues) => {
      setSuccess(false);
      setSubmitError(null);

      startTransition(async () => {
        try {
          await submitReview({
            bookingId,
            guideId,
            listingId,
            overall: values.overall,
            material: values.material,
            engagement: values.engagement,
            knowledge: values.knowledge,
            route: values.route,
            body: values.body,
          });
          setSuccess(true);
        } catch (e) {
          const message =
            e instanceof Error ? e.message : "Не удалось опубликовать отзыв";
          setSubmitError(message);
        }
      });
    },
    [bookingId, guideId, listingId],
  );

  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">
          Оцените поездку: «{listingTitle}»
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {success ? (
          <Alert className="border-success/30 bg-success/10">
            <CheckCircle2 className="text-success" aria-hidden />
            <AlertTitle>Отзыв опубликован</AlertTitle>
            <AlertDescription>
              Спасибо — отзыв сохранён и отображается в профиле гида.
            </AlertDescription>
          </Alert>
        ) : null}

        {submitError ? (
          <Alert variant="destructive">
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}

        {!success ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Controller
              name="overall"
              control={control}
              render={({ field }) => (
                <StarRatingInput
                  value={field.value}
                  onChange={field.onChange}
                  label="Общая оценка"
                  size="md"
                />
              )}
            />
            {errors.overall ? (
              <p className="text-sm text-destructive">{errors.overall.message}</p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="material"
                control={control}
                render={({ field }) => (
                  <StarRatingInput
                    value={field.value}
                    onChange={field.onChange}
                    label="Материал"
                    size="sm"
                  />
                )}
              />
              <Controller
                name="engagement"
                control={control}
                render={({ field }) => (
                  <StarRatingInput
                    value={field.value}
                    onChange={field.onChange}
                    label="Заинтересованность"
                    size="sm"
                  />
                )}
              />
              <Controller
                name="knowledge"
                control={control}
                render={({ field }) => (
                  <StarRatingInput
                    value={field.value}
                    onChange={field.onChange}
                    label="Знания гида"
                    size="sm"
                  />
                )}
              />
              <Controller
                name="route"
                control={control}
                render={({ field }) => (
                  <StarRatingInput
                    value={field.value}
                    onChange={field.onChange}
                    label="Маршрут"
                    size="sm"
                  />
                )}
              />
            </div>
            {(errors.material ||
              errors.engagement ||
              errors.knowledge ||
              errors.route) ? (
              <p className="text-sm text-destructive">
                {errors.material?.message ??
                  errors.engagement?.message ??
                  errors.knowledge?.message ??
                  errors.route?.message}
              </p>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="review-body">Напишите отзыв</Label>
              <Textarea
                id="review-body"
                rows={5}
                className="min-h-[120px] resize-y"
                aria-invalid={!!errors.body}
                {...register("body")}
              />
              {errors.body ? (
                <p className="text-sm text-destructive">{errors.body.message}</p>
              ) : null}
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Публикация…" : "Опубликовать отзыв"}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
