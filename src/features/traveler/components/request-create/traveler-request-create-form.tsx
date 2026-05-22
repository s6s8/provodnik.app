"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, useController } from "react-hook-form";
import type { z } from "zod";

import {
  DATE_WINDOW_VALUES,
  travelerRequestSchema,
  type DateWindowValue,
} from "@/data/traveler-request/schema";
import { createRequestAction } from "@/app/(protected)/traveler/requests/new/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { todayMoscowISODate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { INTEREST_CHIPS } from "@/data/interests";

type RequestFormValues = z.infer<typeof travelerRequestSchema>;

const DATE_WINDOW_LABELS: Record<DateWindowValue, string> = {
  one_day: "±1 день",
  two_days: "±2 дня",
  three_days: "±3 дня",
  week: "±неделя",
  two_weeks: "±2 недели",
};

export function TravelerRequestCreateForm() {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(travelerRequestSchema),
    defaultValues: {
      mode: "assembly",
      interests: [] as RequestFormValues["interests"],
      destination: "",
      startDate: "",
      dateFlexibility: "exact",
      dateLocked: true,
      timeLocked: true,
      countLocked: true,
      budgetLocked: true,
      dateWindow: "week",
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
  const dateLocked = useWatch({ control, name: "dateLocked" }) ?? true;
  const timeLocked = useWatch({ control, name: "timeLocked" }) ?? true;
  const countLocked = useWatch({ control, name: "countLocked" }) ?? true;
  const budgetLocked = useWatch({ control, name: "budgetLocked" }) ?? true;
  const dateWindow = useWatch({ control, name: "dateWindow" }) ?? "week";
  const isAssembly = mode === "assembly";
  const isLoading = isSubmitting || isPending;

  const participants = isAssembly ? (groupSizeCurrent ?? 1) : (groupSize ?? 1);
  const validBudget = budgetLocked && Number.isFinite(budget) && budget > 0 ? budget : null;
  const totalRub = validBudget !== null ? validBudget * (participants ?? 1) : null;
  const budgetErrorMessage =
    budgetLocked &&
    errors.budgetPerPersonRub &&
    (!Number.isFinite(budget) || budget == null || budget <= 0)
      ? "Введите бюджет или переключитесь на ↔️"
      : errors.budgetPerPersonRub?.message;

  const onSubmit = React.useCallback(
    (values: RequestFormValues) => {
      setServerError(null);

      const fd = new FormData();
      fd.set("mode", values.mode);
      for (const i of values.interests) { fd.append("interests[]", i); }
      fd.set("destination", values.destination);
      fd.set("startDate", values.startDate);
      fd.set("dateFlexibility", values.dateFlexibility ?? "exact");
      fd.set("dateLocked", String(values.dateLocked ?? true));
      fd.set("timeLocked", String(values.timeLocked ?? true));
      fd.set("countLocked", String(values.countLocked ?? true));
      fd.set("budgetLocked", String(values.budgetLocked ?? true));
      fd.set("dateWindow", values.dateWindow ?? "week");
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
          {(["assembly", "private"] as const).map((m) => (
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
        <FieldLabel>Темы поездки</FieldLabel>
        <div className="grid grid-cols-3 gap-2">
          {INTEREST_CHIPS.map((opt) => {
            const selected = interestsField.value.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  const next = selected
                    ? interestsField.value.filter((s) => s !== opt.id)
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
          <FieldHeader>
            <FieldLabel htmlFor="startDate">Дата</FieldLabel>
            <LockToggle
              locked={dateLocked}
              lockedLabel="Зафиксировать дату"
              flexibleLabel="Разрешить дату в окне"
              onChange={(next) => form.setValue("dateLocked", next, { shouldDirty: true })}
            />
          </FieldHeader>
          <Input
            id="startDate"
            type="date"
            min={todayMoscowISODate()}
            aria-invalid={Boolean(errors.startDate)}
            aria-describedby={errors.startDate ? "startDate-error" : undefined}
            {...register("startDate")}
          />
          {!dateLocked ? (
            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
              aria-label="Окно гибкости даты"
              {...register("dateWindow")}
            >
              {DATE_WINDOW_VALUES.map((value) => (
                <option key={value} value={value}>
                  {DATE_WINDOW_LABELS[value]}
                </option>
              ))}
            </select>
          ) : null}
          <p className="text-sm text-muted-foreground">
            {dateLocked
              ? "дата окончательная"
              : `гид может предложить дату в пределах ${DATE_WINDOW_LABELS[dateWindow]}`}
          </p>
          <FieldError id="startDate-error" message={errors.startDate?.message} />
        </div>
        <div className="grid gap-2">
          <FieldHeader>
            <FieldLabel htmlFor="startTime">Начало (ЧЧ:ММ)</FieldLabel>
            <LockToggle
              locked={timeLocked}
              lockedLabel="Зафиксировать время"
              flexibleLabel="Разрешить другое время"
              onChange={(next) => form.setValue("timeLocked", next, { shouldDirty: true })}
            />
          </FieldHeader>
          <Input
            id="startTime"
            type="time"
            aria-invalid={Boolean(errors.startTime)}
            {...register("startTime")}
          />
          <p className="text-sm text-muted-foreground">
            {timeLocked ? "время окончательное" : "гид может предложить другое время"}
          </p>
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

      {/* Group counters — conditional on mode */}
      {isAssembly ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldHeader>
              <FieldLabel htmlFor="groupSizeCurrent">Количество человек</FieldLabel>
              <LockToggle
                locked={countLocked}
                lockedLabel="Зафиксировать количество"
                flexibleLabel="Разрешить другое количество"
                onChange={(next) => form.setValue("countLocked", next, { shouldDirty: true })}
              />
            </FieldHeader>
            <Input
              id="groupSizeCurrent"
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              aria-invalid={Boolean(errors.groupSizeCurrent)}
              {...register("groupSizeCurrent", { valueAsNumber: true })}
            />
            <p className="text-sm text-muted-foreground">
              {countLocked
                ? "количество окончательное"
                : "гид может предложить другое количество"}
            </p>
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
              {...register("groupMax", {
                setValueAs: (v) => (v === "" || v == null ? undefined : Number(v)),
              })}
            />
            <FieldHint>Комфортный максимум участников.</FieldHint>
            <FieldError id="groupMax-error" message={errors.groupMax?.message} />
          </div>
        </div>
      ) : (
        <div className="grid gap-2">
          <FieldHeader>
            <FieldLabel htmlFor="groupSize">Количество человек</FieldLabel>
            <LockToggle
              locked={countLocked}
              lockedLabel="Зафиксировать количество"
              flexibleLabel="Разрешить другое количество"
              onChange={(next) => form.setValue("countLocked", next, { shouldDirty: true })}
            />
          </FieldHeader>
          <Input
            id="groupSize"
            type="number"
            inputMode="numeric"
            min={1}
            max={20}
            aria-invalid={Boolean(errors.groupSize)}
            {...register("groupSize", { valueAsNumber: true })}
          />
          <p className="text-sm text-muted-foreground">
            {countLocked
              ? "количество окончательное"
              : "гид может предложить другое количество"}
          </p>
          <FieldError id="groupSize-error" message={errors.groupSize?.message} />
        </div>
      )}

      {/* Budget */}
      <div className="grid gap-2">
        <FieldHeader>
          <FieldLabel htmlFor="budgetPerPersonRub">Бюджет на человека (₽)</FieldLabel>
          <LockToggle
            locked={budgetLocked}
            lockedLabel="Зафиксировать бюджет"
            flexibleLabel="Ждать предложения от гидов"
            onChange={(next) => {
              form.setValue("budgetLocked", next, { shouldDirty: true });
              if (next) {
                form.setValue(
                  "budgetPerPersonRub",
                  undefined as unknown as RequestFormValues["budgetPerPersonRub"],
                  { shouldDirty: true },
                );
              } else {
                form.setValue("budgetPerPersonRub", 1000, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                form.clearErrors("budgetPerPersonRub");
              }
            }}
          />
        </FieldHeader>
        {budgetLocked ? (
          <Input
            id="budgetPerPersonRub"
            type="number"
            inputMode="numeric"
            min={1000}
            max={2000000}
            aria-invalid={Boolean(errors.budgetPerPersonRub)}
            {...register("budgetPerPersonRub", {
              setValueAs: (value) =>
                value === "" || value == null ? undefined : Number(value),
            })}
          />
        ) : (
          <p className="rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            Жду предложения от гидов
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          {budgetLocked ? "окончательная цена" : "жду предложения от гидов"}
        </p>
        <FieldError id="budgetPerPersonRub-error" message={budgetErrorMessage} />
        <div className="flex items-center justify-between rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Цена за группу</span>
          <span className="font-semibold text-foreground">
            {totalRub !== null
              ? `${totalRub.toLocaleString("ru-RU")} ₽`
              : "—"}
          </span>
        </div>
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

function FieldHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cn("flex items-center justify-between gap-3", className)}
    />
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

function LockToggle({
  locked,
  lockedLabel,
  flexibleLabel,
  onChange,
}: {
  locked: boolean;
  lockedLabel: string;
  flexibleLabel: string;
  onChange: (locked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-1" aria-label="Гибкость параметра">
      <button
        type="button"
        aria-label={lockedLabel}
        aria-pressed={locked}
        onClick={() => {
          if (!locked) onChange(true);
        }}
        className={cn(
          "cursor-pointer rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted/50 focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none",
          locked ? "text-primary" : "text-muted-foreground",
        )}
      >
        🔒
      </button>
      <button
        type="button"
        aria-label={flexibleLabel}
        aria-pressed={!locked}
        onClick={() => {
          if (locked) onChange(false);
        }}
        className={cn(
          "cursor-pointer rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted/50 focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none",
          locked ? "text-muted-foreground" : "text-primary",
        )}
      >
        ↔️
      </button>
    </div>
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
