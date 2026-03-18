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
import type { TravelerRequestRecord } from "@/data/traveler-request/types";
import {
  listLocalGuideOffersForRequest,
  upsertLocalGuideOffer,
  type GuideOfferLocalRecord,
} from "@/data/guide-offer/local-store";
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

function formatExperienceType(value: TravelerRequestRecord["request"]["experienceType"]) {
  switch (value) {
    case "city":
      return "Город";
    case "nature":
      return "Природа";
    case "culture":
      return "Культура";
    case "food":
      return "Еда";
    case "adventure":
    case "relax":
      return "Отдых";
    default: {
      const exhaustive: never = value;
      return exhaustive;
    }
  }
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
  record,
}: {
  record: TravelerRequestRecord;
}) {
  const [submittedOffer, setSubmittedOffer] = React.useState<GuideOfferLocalRecord | null>(
    null,
  );
  const [existingOffers, setExistingOffers] = React.useState<GuideOfferLocalRecord[]>([]);

  React.useEffect(() => {
    setExistingOffers(listLocalGuideOffersForRequest(record.id));
  }, [record.id]);

  const form = useForm<GuideOfferDraft>({
    resolver: zodResolver(guideOfferSchema),
    defaultValues: {
      priceTotalRub: record.request.budgetPerPersonRub * record.request.groupSize,
      timingSummary: `Ответ в течение 24 часов, старт около ${record.request.startDate}`,
      capacity: Math.max(record.request.groupSize, 4),
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
    const next = upsertLocalGuideOffer(record.id, values, submittedOffer?.id);
    setSubmittedOffer(next);
    setExistingOffers(listLocalGuideOffersForRequest(record.id));
  }, [record.id, submittedOffer?.id]);

  const handleReset = React.useCallback(() => {
    setSubmittedOffer(null);
    reset();
  }, [reset]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" className="-ml-3 px-3">
          <Link href="/guide/requests">
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
                Запрос: {record.request.destination}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Посмотрите, что важно гостю, и соберите предложение по маршруту, цене и
                условиям под этот запрос.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {formatExperienceType(record.request.experienceType)}
              </Badge>
              <Badge variant="outline">
                {record.request.startDate} to {record.request.endDate}
              </Badge>
              <Badge variant="outline">
                Группа {record.request.groupSize} чел.
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoBlock
                label="Направление"
                value={record.request.destination}
              />
              <InfoBlock
                label="Формат группы"
                value={record.request.groupPreference}
              />
              <InfoBlock
                label="Бюджет на человека"
                value={formatRub(record.request.budgetPerPersonRub)}
              />
              <InfoBlock
                label="Гибкость по условиям"
                value={
                  record.request.allowGuideSuggestionsOutsideConstraints
                    ? "Открыт к предложениям рядом по формату"
                    : "Жёсткие ограничения по запросу"
                }
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Комментарий гостя</p>
              <div className="rounded-lg border border-border/70 bg-background/60 p-3">
                <p className="text-sm text-foreground">
                  {record.request.notes || "Гость не добавил дополнительных комментариев."}
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
              <CardTitle>Сигналы спроса и переговоров</CardTitle>
              <p className="text-sm text-muted-foreground">
                Быстрые подсказки: насколько вы укладываетесь в бюджет и сколько откликов уже есть.
              </p>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <InfoBlock
                label="Бюджет на человека"
                value={formatRub(record.request.budgetPerPersonRub)}
              />
              <InfoBlock
                label="Откликов (локально)"
                value={`${existingOffers.length}`}
              />
              <InfoBlock
                label="Текущий черновик"
                value={
                  submittedOffer
                    ? statusLabelForDraft({
                        budgetPerPersonRub: record.request.budgetPerPersonRub,
                        groupSize: record.request.groupSize,
                        priceTotalRub: submittedOffer.draft.priceTotalRub,
                      })
                    : "Пока не сохранён"
                }
              />
            </CardContent>
          </Card>

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
                  value={formatRub(submittedOffer.draft.priceTotalRub)}
                />
                <InfoBlock
                  label="Сводка по таймингу"
                  value={submittedOffer.draft.timingSummary}
                />
                <InfoBlock
                  label="Максимум гостей"
                  value={`${submittedOffer.draft.capacity} человек`}
                />
                <InfoBlock
                  label="Действительно до"
                  value={formatDateLabel(submittedOffer.draft.expiresAt)}
                />
                <InfoBlock
                  label="Что включено"
                  value={submittedOffer.draft.inclusions.join(", ")}
                />
                {submittedOffer.draft.notes ? (
                  <InfoBlock label="Комментарий гида" value={submittedOffer.draft.notes} />
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {existingOffers.length > 0 ? (
            <Card className="border-border/70 bg-card/90">
              <CardHeader className="space-y-1">
                <CardTitle>Мои последние предложения</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Сохранённые локально предложения для этого запроса.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {existingOffers.slice(0, 3).map((offer) => (
                  <div
                    key={offer.id}
                    className="rounded-lg border border-border/70 bg-background/60 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {formatRub(offer.draft.priceTotalRub)}
                      </p>
                      <Badge variant="outline">
                        {statusLabelForDraft({
                          budgetPerPersonRub: record.request.budgetPerPersonRub,
                          groupSize: record.request.groupSize,
                          priceTotalRub: offer.draft.priceTotalRub,
                        })}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Обновлено {formatDateLabel(offer.updatedAt)}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {offer.draft.timingSummary}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function statusLabelForDraft({
  budgetPerPersonRub,
  groupSize,
  priceTotalRub,
}: {
  budgetPerPersonRub: number;
  groupSize: number;
  priceTotalRub: number;
}) {
  const perPerson = priceTotalRub / Math.max(groupSize, 1);
  const delta = perPerson - budgetPerPersonRub;
  const abs = Math.abs(delta);

  if (abs <= 250) return "В бюджете";
  if (delta > 0) return `Выше бюджета на ${formatRub(Math.round(delta))}`;
  return `Ниже бюджета на ${formatRub(Math.round(abs))}`;
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
