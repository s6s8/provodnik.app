"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import { useForm } from "react-hook-form";

import { createTravelerRequestPersistent } from "@/data/traveler-request/local-store";
import {
  travelerExperienceTypes,
  travelerRequestSchema,
  type TravelerRequest,
} from "@/data/traveler-request/schema";
import { submitTravelerRequest } from "@/data/traveler-request/submit";
import type { TravelerRequestRecord } from "@/data/traveler-request/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type RequestFormValues = TravelerRequest;

function formatRub(amount: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatExperienceType(
  value: TravelerRequest["experienceType"]
): string {
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
      return "Приключение";
    case "relax":
      return "Отдых";
    default: {
      const exhaustive: never = value;
      return exhaustive;
    }
  }
}

export function TravelerRequestCreateForm() {
  const [submitted, setSubmitted] = React.useState<TravelerRequestRecord | null>(
    null
  );

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(travelerRequestSchema),
    defaultValues: {
      experienceType: "city",
      destination: "",
      startDate: "",
      endDate: "",
      groupSize: 2,
      groupPreference: "private",
      openToJoiningOthers: false,
      allowGuideSuggestionsOutsideConstraints: true,
      budgetPerPersonRub: 80_000,
      notes: "",
    },
    mode: "onTouched",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    reset,
  } = form;

  const onSubmit = React.useCallback(async (values: RequestFormValues) => {
    const submission = await submitTravelerRequest(values);
    const record = await createTravelerRequestPersistent(submission.request);
    setSubmitted(record);
  }, []);

  const handleCreateAnother = React.useCallback(() => {
    setSubmitted(null);
    reset();
  }, [reset]);

  if (submitted) {
    return (
      <div className="space-y-4">
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="flex flex-row items-start gap-4 space-y-0">
            <div className="mt-0.5 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CheckCircle2 className="size-5" />
            </div>
            <div className="space-y-1">
              <CardTitle>Запрос сохранён</CardTitle>
              <p className="text-sm text-muted-foreground">
                Сейчас запрос хранится локально и доступен в вашем кабинете
                путешественника на этом устройстве.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <SummaryRow
              label="Категория"
              value={formatExperienceType(submitted.request.experienceType)}
            />
            <SummaryRow label="Направление" value={submitted.request.destination} />
            <SummaryRow
              label="Даты"
              value={`${submitted.request.startDate} — ${submitted.request.endDate}`}
            />
            <SummaryRow
              label="Размер группы"
              value={`${submitted.request.groupSize} путешественник${
                submitted.request.groupSize === 1 ? "" : "а"
              }`}
            />
            <SummaryRow
              label="Формат"
              value={
                submitted.request.groupPreference === "private"
                  ? "Только ваша компания"
                  : "Готовы к группе"
              }
            />
            <SummaryRow
              label="Можно присоединиться к другим"
              value={submitted.request.openToJoiningOthers ? "Да" : "Нет"}
            />
            <SummaryRow
              label="Можно предлагать варианты вне рамок"
              value={
                submitted.request.allowGuideSuggestionsOutsideConstraints
                  ? "Да"
                  : "Нет"
              }
            />
            <SummaryRow
              label="Бюджет на человека"
              value={formatRub(submitted.request.budgetPerPersonRub)}
            />
            {submitted.request.notes ? (
              <SummaryRow label="Пожелания" value={submitted.request.notes} />
            ) : null}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <Link href={`/traveler/requests/${submitted.id}`}>
              Открыть запрос
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/traveler/requests">Все запросы</Link>
          </Button>
          <Button type="button" onClick={handleCreateAnother}>
            Создать ещё один запрос
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="grid gap-5"
      onSubmit={handleSubmit(onSubmit)}
      aria-label="Создать запрос путешественника"
    >
      <div className="grid gap-2">
        <FieldLabel htmlFor="experienceType">Категория поездки</FieldLabel>
        <select
          id="experienceType"
          aria-invalid={Boolean(errors.experienceType)}
          aria-describedby={
            errors.experienceType ? "experienceType-error" : undefined
          }
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          {...register("experienceType")}
        >
          {travelerExperienceTypes.map((option) => (
            <option key={option} value={option}>
              {formatExperienceType(option)}
            </option>
          ))}
        </select>
        <FieldHint>Выберите основной формат, который вам ближе.</FieldHint>
        <FieldError
          id="experienceType-error"
          message={errors.experienceType?.message}
        />
      </div>

      <div className="grid gap-2">
        <FieldLabel htmlFor="destination">Куда хотите поехать?</FieldLabel>
        <Input
          id="destination"
          placeholder="Например: Казань, Алтай, Байкал"
          autoComplete="off"
          aria-invalid={Boolean(errors.destination)}
          aria-describedby={errors.destination ? "destination-error" : undefined}
          {...register("destination")}
        />
        <FieldHint>
          Город, регион или примерное направление — для начала достаточно.
        </FieldHint>
        <FieldError id="destination-error" message={errors.destination?.message} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <FieldLabel htmlFor="startDate">Дата начала</FieldLabel>
          <Input
            id="startDate"
            type="date"
            aria-invalid={Boolean(errors.startDate)}
            aria-describedby={errors.startDate ? "startDate-error" : undefined}
            {...register("startDate")}
          />
          <FieldError id="startDate-error" message={errors.startDate?.message} />
        </div>

        <div className="grid gap-2">
          <FieldLabel htmlFor="endDate">Дата окончания</FieldLabel>
          <Input
            id="endDate"
            type="date"
            aria-invalid={Boolean(errors.endDate)}
            aria-describedby={errors.endDate ? "endDate-error" : undefined}
            {...register("endDate")}
          />
          <FieldError id="endDate-error" message={errors.endDate?.message} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <FieldLabel htmlFor="groupSize">Сколько вас поедет?</FieldLabel>
          <Input
            id="groupSize"
            type="number"
            inputMode="numeric"
            min={1}
            max={20}
            aria-invalid={Boolean(errors.groupSize)}
            aria-describedby={errors.groupSize ? "groupSize-error" : undefined}
            {...register("groupSize", { valueAsNumber: true })}
          />
          <FieldHint>Укажите количество человек в вашей компании.</FieldHint>
          <FieldError id="groupSize-error" message={errors.groupSize?.message} />
        </div>

        <div className="grid gap-2">
          <FieldLabel>Формат поездки</FieldLabel>
          <fieldset className="grid gap-2" aria-label="Формат группы">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="radio"
                value="private"
                className="mt-1"
                {...register("groupPreference")}
              />
              <span>
                <span className="font-medium text-foreground">Только ваша компания</span>
                <span className="block text-xs text-muted-foreground">
                  Без присоединения других путешественников к вашей компании.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="radio"
                value="group"
                className="mt-1"
                {...register("groupPreference")}
              />
              <span>
                <span className="font-medium text-foreground">Группа</span>
                <span className="block text-xs text-muted-foreground">
                  Готовы к общей поездке с другими путешественниками.
                </span>
              </span>
            </label>
          </fieldset>
          <FieldError
            id="groupPreference-error"
            message={errors.groupPreference?.message}
          />
        </div>

        <div className="grid gap-2">
          <FieldLabel htmlFor="budgetPerPersonRub">
            Бюджет на человека (₽)
          </FieldLabel>
          <Input
            id="budgetPerPersonRub"
            type="number"
            inputMode="numeric"
            min={1000}
            max={2000000}
            aria-invalid={Boolean(errors.budgetPerPersonRub)}
            aria-describedby={
              errors.budgetPerPersonRub ? "budgetPerPersonRub-error" : undefined
            }
            {...register("budgetPerPersonRub", { valueAsNumber: true })}
          />
          <FieldHint>
            Верхняя граница бюджета помогает гидам предлагать реалистичные программы.
          </FieldHint>
          <FieldError
            id="budgetPerPersonRub-error"
            message={errors.budgetPerPersonRub?.message}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            {...register("openToJoiningOthers")}
          />
          <span>
            <span className="font-medium text-foreground">
              Готовы присоединиться к другим путешественникам
            </span>
            <span className="block text-xs text-muted-foreground">
              Если выберете формат «группа», гиды смогут предложить подходящую
              существующую группу.
            </span>
          </span>
        </label>
        <FieldError
          id="openToJoiningOthers-error"
          message={errors.openToJoiningOthers?.message}
        />
      </div>

      <div className="grid gap-2">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            {...register("allowGuideSuggestionsOutsideConstraints")}
          />
          <span>
            <span className="font-medium text-foreground">
              Разрешить предлагать варианты вне заданных рамок
            </span>
            <span className="block text-xs text-muted-foreground">
              Гиды смогут предлагать близкие даты, небольшой сдвиг бюджета или
              другой темп, если объяснят, зачем это нужно.
            </span>
          </span>
        </label>
      </div>

      <div className="grid gap-2">
        <FieldLabel htmlFor="notes">Пожелания (необязательно)</FieldLabel>
        <Textarea
          id="notes"
          placeholder="Темп поездки, интересы, ограничения по здоровью, стиль отдыха…"
          aria-invalid={Boolean(errors.notes)}
          aria-describedby={errors.notes ? "notes-error" : undefined}
          {...register("notes")}
        />
        <FieldHint>
          Пишите коротко — детали можно будет уточнить после первых откликов.
        </FieldHint>
        <FieldError id="notes-error" message={errors.notes?.message} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {isSubmitSuccessful
            ? "Готово. В любой момент можно создать ещё один запрос."
            : null}
        </p>
        <Button type="submit" disabled={isSubmitting}>
          Отправить запрос
        </Button>
      </div>
    </form>
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
    <p
      {...props}
      className={cn("text-xs text-muted-foreground", className)}
    />
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-lg border border-border/70 bg-background/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
