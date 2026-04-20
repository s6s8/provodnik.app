"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, RotateCcw } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import {
  guideOfferSchema,
  type GuideOfferDraft,
} from "@/data/guide-offer/schema";
import type { RequestRecord } from "@/data/supabase/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function formatRub(amount: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}

function splitCommaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function defaultExpiryValue() {
  const value = new Date();
  value.setDate(value.getDate() + 2);
  value.setHours(18, 0, 0, 0);
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  const hours = `${value.getHours()}`.padStart(2, "0");
  const minutes = `${value.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GuideRequestDetailScreen({
  inboxItem,
}: {
  inboxItem: RequestRecord;
}) {
  const [submittedOffer, setSubmittedOffer] = React.useState<GuideOfferDraft | null>(
    null
  );

  const form = useForm<GuideOfferDraft>({
    resolver: zodResolver(guideOfferSchema),
    defaultValues: {
      priceTotalRub: inboxItem.budgetRub * inboxItem.groupSize,
      timingSummary: `Ответ в течение 24 часов, старт около ${inboxItem.dateLabel}`,
      capacity: Math.max(inboxItem.groupSize, 4),
      inclusions: ["Услуги гида", "Планирование маршрута", "Локальные рекомендации"],
      expiresAt: defaultExpiryValue(),
      notes: "",
    },
    mode: "onTouched",
  });

  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const inclusions = useWatch({ control, name: "inclusions" }) ?? [];

  const onSubmit = React.useCallback(async (values: GuideOfferDraft) => {
    setSubmittedOffer(values);
  }, []);

  const handleReset = React.useCallback(() => {
    setSubmittedOffer(null);
    reset();
  }, [reset]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" className="-ml-3 px-3">
          <Link href="/guide/inbox">
            <ArrowLeft className="size-4" />
            Входящие запросы
          </Link>
        </Button>
        <Badge variant="outline">Кабинет гида</Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-3">
            <div className="space-y-1">
              <CardTitle className="text-2xl">
                Запрос от {inboxItem.requesterName}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Посмотрите, что важно гостю, и соберите предложение по маршруту, цене и
                условиям под этот запрос.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {inboxItem.format}
              </Badge>
              <Badge variant="outline">
                {inboxItem.dateLabel}
              </Badge>
              {inboxItem.startTime ? (
                <Badge variant="outline">
                  {inboxItem.startTime}{inboxItem.endTime ? `–${inboxItem.endTime}` : ""}
                </Badge>
              ) : null}
              <Badge variant="outline">
                Группа {inboxItem.groupSize} чел.
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoBlock
                label="Направление"
                value={inboxItem.destination}
              />
              <InfoBlock
                label="Формат"
                value={inboxItem.format}
              />
              <InfoBlock
                label="Бюджет"
                value={formatRub(inboxItem.budgetRub)}
              />
              <InfoBlock
                label="Статус"
                value={inboxItem.status}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Описание запроса</p>
              <div className="rounded-lg border border-border/70 bg-background/60 p-3">
                <p className="text-sm text-foreground">
                  {inboxItem.description || "Гость не добавил дополнительных комментариев."}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Чек‑лист гида перед ответом
              </p>
              <ul className="grid gap-2 text-sm text-muted-foreground">
                <li className="rounded-lg border border-border/70 bg-background/60 p-3">
                  Оцените, реалистичен ли бюджет и совпадает ли темп поездки с
                  направлением.
                </li>
                <li className="rounded-lg border border-border/70 bg-background/60 p-3">
                  Сформулируйте сроки и формат по дням, чтобы гость быстро сравнил
                  предложения.
                </li>
                <li className="rounded-lg border border-border/70 bg-background/60 p-3">
                  Выпишите, что именно включено в цену, без размытых формулировок.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/70 bg-card/90">
            <CardHeader className="space-y-1">
              <CardTitle>Конструктор предложения</CardTitle>
              <p className="text-sm text-muted-foreground">
                Черновик предложения хранится только на этом устройстве. Здесь вы
                отрабатываете модель цены и условий.
              </p>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-5"
                onSubmit={handleSubmit(onSubmit)}
                aria-label="Конструктор предложения гида"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <FieldLabel htmlFor="priceTotalRub">Итоговая цена (RUB)</FieldLabel>
                    <Input
                      id="priceTotalRub"
                      type="number"
                      inputMode="numeric"
                      min={1000}
                      aria-invalid={Boolean(errors.priceTotalRub)}
                      aria-describedby={
                        errors.priceTotalRub ? "priceTotalRub-error" : undefined
                      }
                      {...register("priceTotalRub", { valueAsNumber: true })}
                    />
                    <FieldError
                      id="priceTotalRub-error"
                      message={errors.priceTotalRub?.message}
                    />
                  </div>

                  <div className="grid gap-2">
                    <FieldLabel htmlFor="capacity">Максимум гостей</FieldLabel>
                    <Input
                      id="capacity"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      aria-invalid={Boolean(errors.capacity)}
                      aria-describedby={errors.capacity ? "capacity-error" : undefined}
                      {...register("capacity", { valueAsNumber: true })}
                    />
                    <FieldError
                      id="capacity-error"
                      message={errors.capacity?.message}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <FieldLabel htmlFor="timingSummary">Сводка по таймингу</FieldLabel>
                  <Input
                    id="timingSummary"
                    placeholder="Например, 3 дня, утренние старты, гибкий перенос по погоде"
                    aria-invalid={Boolean(errors.timingSummary)}
                    aria-describedby={
                      errors.timingSummary ? "timingSummary-error" : undefined
                    }
                    {...register("timingSummary")}
                  />
                  <FieldHint>
                    Коротко и по делу, чтобы гость мог сравнить с другими предложениями.
                  </FieldHint>
                  <FieldError
                    id="timingSummary-error"
                    message={errors.timingSummary?.message}
                  />
                </div>

                <div className="grid gap-2">
                  <FieldLabel htmlFor="inclusions">Что включено</FieldLabel>
                  <Input
                    id="inclusions"
                    placeholder="Например, сопровождение, билеты, помощь с транспортом"
                    value={inclusions.join(", ")}
                    onChange={(event) => {
                      setValue("inclusions", splitCommaList(event.target.value), {
                        shouldTouch: true,
                        shouldValidate: true,
                      });
                    }}
                    aria-invalid={Boolean(errors.inclusions)}
                    aria-describedby={
                      errors.inclusions ? "inclusions-error" : undefined
                    }
                  />
                  <FieldHint>
                    Перечислите через запятую. Гость должен понимать, за что платит.
                  </FieldHint>
                  <FieldError
                    id="inclusions-error"
                    message={
                      typeof errors.inclusions?.message === "string"
                        ? errors.inclusions.message
                        : undefined
                    }
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <FieldLabel htmlFor="expiresAt">Срок действия предложения</FieldLabel>
                    <Input
                      id="expiresAt"
                      type="datetime-local"
                      aria-invalid={Boolean(errors.expiresAt)}
                      aria-describedby={errors.expiresAt ? "expiresAt-error" : undefined}
                      {...register("expiresAt")}
                    />
                    <FieldError
                      id="expiresAt-error"
                      message={errors.expiresAt?.message}
                    />
                  </div>
                  <div className="grid gap-2">
                    <FieldLabel htmlFor="notes">Комментарий гида</FieldLabel>
                    <Textarea
                      id="notes"
                      placeholder="Опишите темп, возможные компромиссы и варианты настройки под гостя."
                      aria-invalid={Boolean(errors.notes)}
                      aria-describedby={errors.notes ? "notes-error" : undefined}
                      {...register("notes")}
                    />
                    <FieldError id="notes-error" message={errors.notes?.message} />
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="submit" disabled={isSubmitting}>
                    Сохранить черновик
                  </Button>
                  <Button type="button" variant="outline" onClick={handleReset}>
                    Сбросить
                    <RotateCcw className="size-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {submittedOffer ? (
            <Card className="border-border/70 bg-card/90">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <div className="mt-0.5 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <CheckCircle2 className="size-5" />
                </div>
                <div className="space-y-1">
                  <CardTitle>Черновик предложения сохранён</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Структура предложения сохранена локально и готова к последующей
                    привязке к бэкенду и бронированиям.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoBlock
                  label="Итоговая цена"
                  value={formatRub(submittedOffer.priceTotalRub)}
                />
                <InfoBlock
                  label="Сводка по таймингу"
                  value={submittedOffer.timingSummary}
                />
                <InfoBlock
                  label="Максимум гостей"
                  value={`${submittedOffer.capacity} человек`}
                />
                <InfoBlock
                  label="Действительно до"
                  value={formatDateLabel(submittedOffer.expiresAt)}
                />
                <InfoBlock
                  label="Что включено"
                  value={submittedOffer.inclusions.join(", ")}
                />
                {submittedOffer.notes ? (
                  <InfoBlock label="Комментарий гида" value={submittedOffer.notes} />
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FieldLabel(props: React.ComponentProps<"label">) {
  return (
    <label
      {...props}
      className={cn("text-sm font-medium text-foreground", props.className)}
    />
  );
}

function FieldHint({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p {...props} className={cn("text-xs text-muted-foreground", className)} />
  );
}

function FieldError({
  id,
  message,
}: {
  id: string;
  message?: string;
}) {
  if (!message) return null;

  return (
    <p id={id} className="text-xs font-medium text-destructive">
      {message}
    </p>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-lg border border-border/70 bg-background/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground whitespace-pre-wrap">
        {value}
      </p>
    </div>
  );
}
