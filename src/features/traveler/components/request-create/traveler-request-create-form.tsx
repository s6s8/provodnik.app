"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, useController } from "react-hook-form";

import {
  travelerRequestSchema,
  type TravelerRequest,
} from "@/data/traveler-request/schema";
import { createRequestAction } from "@/app/(protected)/traveler/requests/new/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { INTEREST_CHIPS } from "@/data/interests";

type RequestFormValues = TravelerRequest;

export function TravelerRequestCreateForm() {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(travelerRequestSchema),
    defaultValues: {
      mode: "private",
      interests: [] as string[],
      destination: "",
      startDate: "",
      dateFlexibility: 'exact' as const,
      startTime: "",
      endTime: "",
      groupSize: 2,
      groupSizeCurrent: 1,
      groupMax: undefined,
      allowGuideSuggestionsOutsideConstraints: true,
      budgetPerPersonRub: 5_000,
      notes: "",
    },
    mode: "onTouched",
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = form;

  const { field: interestsField } = useController({ control, name: "interests" });

  const mode = useWatch({ control, name: "mode" });
  const budget = useWatch({ control, name: "budgetPerPersonRub" });
  const groupSize = useWatch({ control, name: "groupSize" });
  const groupSizeCurrent = useWatch({ control, name: "groupSizeCurrent" });
  const isAssembly = mode === "assembly";
  const isLoading = isSubmitting || isPending;

  const participants = isAssembly ? (groupSizeCurrent ?? 1) : (groupSize ?? 1);
  const validBudget = Number.isFinite(budget) && budget > 0 ? budget : null;
  const totalRub = validBudget !== null ? validBudget * (participants ?? 1) : null;

  const onSubmit = React.useCallback(
    (values: RequestFormValues) => {
      setServerError(null);

      const fd = new FormData();
      fd.set("mode", values.mode);
      for (const i of values.interests) { fd.append("interests[]", i); }
      fd.set("destination", values.destination);
      fd.set("startDate", values.startDate);
      fd.set("dateFlexibility", values.dateFlexibility ?? "exact");
      fd.set("startTime", values.startTime ?? "");
      fd.set("endTime", values.endTime ?? "");

      if (values.mode === "assembly") {
        fd.set("groupSizeCurrent", String(values.groupSizeCurrent ?? 1));
        if (values.groupMax) fd.set("groupMax", String(values.groupMax));
      } else {
        fd.set("groupSize", String(values.groupSize ?? 1));
      }

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

      {/* Mode toggle */}
      <div className="grid gap-2">
        <FieldLabel>Формат поездки</FieldLabel>
        <div className="flex gap-2">
          {(["private", "assembly"] as const).map((m) => (
            <label
              key={m}
              className={cn(
                "flex flex-1 cursor-pointer flex-col gap-0.5 rounded-md border px-3 py-2.5 text-sm transition-colors",
                mode === m
                  ? "border-primary bg-primary/8 text-foreground"
                  : "border-input bg-background text-muted-foreground hover:bg-muted/40",
              )}
            >
              <input
                type="radio"
                value={m}
                className="sr-only"
                {...register("mode")}
              />
              <span className="font-medium">
                {m === "private" ? "Своя группа" : "Сборная группа"}
              </span>
              <span className="text-xs">
                {m === "private"
                  ? "Только ваша группа, без чужих"
                  : "Готовы собрать группу с другими"}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div className="grid gap-2">
        <FieldLabel>Интересы поездки</FieldLabel>
        <div className="grid grid-cols-3 gap-2">
          {INTEREST_CHIPS.map((opt) => {
            const selected = interestsField.value.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  const next = selected
                    ? interestsField.value.filter((s: string) => s !== opt.id)
                    : [...interestsField.value, opt.id];
                  interestsField.onChange(next);
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input bg-background text-muted-foreground hover:bg-muted/40",
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {errors.interests && (
          <p className="text-xs font-medium text-destructive">{errors.interests.message}</p>
        )}
      </div>

      {/* Destination */}
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
        <FieldHint>Город, регион или примерное направление.</FieldHint>
        <FieldError id="destination-error" message={errors.destination?.message} />
      </div>

      {/* Date + time */}
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="grid gap-2">
          <FieldLabel htmlFor="startDate">Дата</FieldLabel>
          <Input
            id="startDate"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            aria-invalid={Boolean(errors.startDate)}
            aria-describedby={errors.startDate ? "startDate-error" : undefined}
            {...register("startDate")}
          />
          <FieldError id="startDate-error" message={errors.startDate?.message} />
        </div>
        <div className="grid gap-2">
          <FieldLabel htmlFor="startTime">Начало (ЧЧ:ММ)</FieldLabel>
          <Input
            id="startTime"
            type="time"
            aria-invalid={Boolean(errors.startTime)}
            {...register("startTime")}
          />
          <FieldError id="startTime-error" message={errors.startTime?.message} />
        </div>
        <div className="grid gap-2">
          <FieldLabel htmlFor="endTime">Конец (ЧЧ:ММ)</FieldLabel>
          <Input
            id="endTime"
            type="time"
            aria-invalid={Boolean(errors.endTime)}
            {...register("endTime")}
          />
          <FieldError id="endTime-error" message={errors.endTime?.message} />
        </div>
      </div>

      {/* Date flexibility */}
      <div className="grid gap-2">
        <FieldLabel>Гибкость дат</FieldLabel>
        <div className="flex gap-2">
          {(
            [
              { value: 'exact', label: 'Точная дата' },
              { value: 'few_days', label: '±пара дней' },
              { value: 'week', label: '±неделя' },
            ] as const
          ).map(({ value, label }) => {
            const current = form.watch('dateFlexibility');
            return (
              <button
                key={value}
                type="button"
                onClick={() => form.setValue('dateFlexibility', value)}
                className={cn(
                  "flex-1 rounded-md border px-3 py-2 text-sm transition-colors",
                  current === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-muted"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Group counters — conditional on mode */}
      {isAssembly ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="groupSizeCurrent">Сейчас в группе</FieldLabel>
            <Input
              id="groupSizeCurrent"
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              aria-invalid={Boolean(errors.groupSizeCurrent)}
              {...register("groupSizeCurrent", { valueAsNumber: true })}
            />
            <FieldHint>Сколько человек уже есть в вашей компании.</FieldHint>
            <FieldError id="groupSizeCurrent-error" message={errors.groupSizeCurrent?.message} />
          </div>
          <div className="grid gap-2">
            <FieldLabel htmlFor="groupMax">Максимум в группе</FieldLabel>
            <Input
              id="groupMax"
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              aria-invalid={Boolean(errors.groupMax)}
              {...register("groupMax", { valueAsNumber: true })}
            />
            <FieldHint>Комфортный максимум участников.</FieldHint>
            <FieldError id="groupMax-error" message={errors.groupMax?.message} />
          </div>
        </div>
      ) : (
        <div className="grid gap-2">
          <FieldLabel htmlFor="groupSize">Сколько вас поедет?</FieldLabel>
          <Input
            id="groupSize"
            type="number"
            inputMode="numeric"
            min={1}
            max={20}
            aria-invalid={Boolean(errors.groupSize)}
            {...register("groupSize", { valueAsNumber: true })}
          />
          <FieldHint>Количество человек в вашей компании.</FieldHint>
          <FieldError id="groupSize-error" message={errors.groupSize?.message} />
        </div>
      )}

      {/* Budget */}
      <div className="grid gap-2">
        <FieldLabel htmlFor="budgetPerPersonRub">Бюджет на человека (₽)</FieldLabel>
        <Input
          id="budgetPerPersonRub"
          type="number"
          inputMode="numeric"
          min={1000}
          max={2000000}
          aria-invalid={Boolean(errors.budgetPerPersonRub)}
          {...register("budgetPerPersonRub", { valueAsNumber: true })}
        />
        <FieldHint>Верхняя граница бюджета помогает гидам предлагать реалистичные программы.</FieldHint>
        <FieldError id="budgetPerPersonRub-error" message={errors.budgetPerPersonRub?.message} />
        <div className="flex items-center justify-between rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Цена за группу</span>
          <span className="font-semibold text-foreground">
            {totalRub !== null
              ? `${totalRub.toLocaleString("ru-RU")} ₽`
              : "—"}
          </span>
        </div>
      </div>

      {/* Allow guide suggestions */}
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
              Гиды смогут предлагать близкие даты, небольшой сдвиг бюджета или другой темп.
            </span>
          </span>
        </label>
      </div>

      {/* Notes */}
      <div className="grid gap-2">
        <FieldLabel htmlFor="notes">Пожелания (необязательно)</FieldLabel>
        <Textarea
          id="notes"
          placeholder="Темп поездки, интересы, ограничения по здоровью, стиль отдыха…"
          aria-invalid={Boolean(errors.notes)}
          {...register("notes")}
        />
        <FieldHint>Пишите коротко — детали можно уточнить после первых откликов.</FieldHint>
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
