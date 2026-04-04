"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  travelerExperienceTypes,
  travelerRequestSchema,
  type TravelerRequest,
} from "@/data/traveler-request/schema";
import { createRequestAction } from "@/app/(protected)/traveler/requests/new/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type RequestFormValues = TravelerRequest;

function formatExperienceType(
  value: TravelerRequest["experienceType"],
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
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

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
    formState: { errors, isSubmitting },
  } = form;

  const isLoading = isSubmitting || isPending;

  const onSubmit = React.useCallback(
    (values: RequestFormValues) => {
      setServerError(null);

      const fd = new FormData();
      fd.set("experienceType", values.experienceType);
      fd.set("destination", values.destination);
      fd.set("startDate", values.startDate);
      fd.set("endDate", values.endDate);
      fd.set("groupSize", String(values.groupSize));
      fd.set("groupPreference", values.groupPreference);
      fd.set("openToJoiningOthers", String(values.openToJoiningOthers));
      fd.set(
        "allowGuideSuggestionsOutsideConstraints",
        String(values.allowGuideSuggestionsOutsideConstraints),
      );
      fd.set("budgetPerPersonRub", String(values.budgetPerPersonRub));
      fd.set("notes", values.notes ?? "");

      startTransition(async () => {
        const result = await createRequestAction({ error: null }, fd);
        if (result?.error) {
          setServerError(result.error);
        }
        // On success the action calls redirect() — no further handling needed here
      });
    },
    [],
  );

  return (
    <form
      className="grid gap-5"
      onSubmit={handleSubmit(onSubmit)}
      aria-label="Создать запрос путешественника"
    >
      {serverError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {serverError}
        </div>
      ) : null}

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
            "disabled:cursor-not-allowed disabled:opacity-50",
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
                <span className="font-medium text-foreground">
                  Только ваша компания
                </span>
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

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Сохраняем…" : "Отправить запрос"}
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

function FieldHint({ className, ...props }: React.ComponentProps<"p">) {
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
