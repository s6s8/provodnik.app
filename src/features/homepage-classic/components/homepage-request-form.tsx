"use client";

import * as React from "react";

import { LANGUAGES } from "@/data/languages";
import { THEMES } from "@/data/themes";
import { LanguageMultiSelect } from "@/components/shared/language-multi-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { todayMoscowISODate } from "@/lib/dates";
import type { DestinationOption } from "@/data/supabase/queries";
import { HomepageAuthGate } from "./homepage-auth-gate";
import { useRequestForm } from "./use-request-form";

interface Props {
  destinations: DestinationOption[];
}

export function HomepageRequestForm({ destinations }: Props) {
  const [showAllThemes, setShowAllThemes] = React.useState(false);
  const {
    form,
    register,
    handleSubmit,
    setValue,
    errors,
    interestsField,
    requestedLanguagesField,
    isAssembly,
    dateFlexibility,
    watchedGroupSize,
    watchedBudgetPerPerson,
    selectedInterests,
    submit,
    authGateOpen,
    setAuthGateOpen,
    handleAuthSuccess,
    serverError,
    isLoading,
  } = useRequestForm();
  const visibleThemes = showAllThemes ? THEMES : THEMES.slice(0, 3);

  return (
    <TooltipProvider>
      <form
        className="grid gap-5 pb-24 sm:pb-0"
        onSubmit={handleSubmit(submit)}
        aria-label="Создать запрос"
        noValidate
      >
      {/* 2. Куда хотите поехать? */}
      <div className="grid gap-2">
        <FieldLabel htmlFor="destination">Куда хотите поехать?</FieldLabel>
        <Input
          id="destination"
          list="destination-options"
          placeholder="Москва, Санкт-Петербург…"
          autoComplete="off"
          aria-invalid={Boolean(errors.destination)}
          aria-describedby={errors.destination ? "destination-error" : undefined}
          {...register("destination")}
        />
        <datalist id="destination-options">
          {destinations.map((d) => (
            <option key={d.name} value={d.name} />
          ))}
        </datalist>
        <FieldError id="destination-error" message={errors.destination?.message} />
      </div>

      {/* 3. Даты и время */}
      <div className="grid gap-3 sm:grid-cols-3 sm:items-start sm:gap-2">
        <div className="grid gap-2">
          <div className="flex min-h-7 items-center gap-1.5">
            <FieldLabel htmlFor="startDate">Дата</FieldLabel>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => {
                    const current = form.getValues("dateFlexibility");
                    setValue("dateFlexibility", current === "exact" ? "few_days" : "exact", {
                      shouldDirty: true,
                    });
                  }}
                  className={cn(
                    "flex h-7 w-7 shrink-0 cursor-pointer select-none items-center justify-center rounded-md border text-sm font-bold leading-none transition-colors",
                    dateFlexibility !== "exact"
                      ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                      : "border-rose-200 bg-rose-100 text-rose-700 hover:border-rose-300 hover:text-rose-800",
                  )}
                >
                  ≈
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-sm">
                <p>Гибкая дата (±2–3 дня)</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="startDate"
            type="date"
            min={todayMoscowISODate()}
            aria-invalid={Boolean(errors.startDate)}
            aria-describedby={errors.startDate ? "startDate-error" : undefined}
            {...register("startDate")}
          />
          <FieldError id="startDate-error" message={errors.startDate?.message} />
        </div>
        <div className="grid gap-2">
          <div className="flex min-h-7 items-center">
            <FieldLabel htmlFor="startTime">Начало</FieldLabel>
          </div>
          <Input
            id="startTime"
            type="time"
            defaultValue="10:00"
            aria-invalid={Boolean(errors.startTime)}
            {...register("startTime")}
          />
          <FieldError id="startTime-error" message={errors.startTime?.message} />
        </div>
        <div className="grid gap-2">
          <div className="flex min-h-7 items-center">
            <FieldLabel htmlFor="endTime">Конец <span className="font-normal text-muted-foreground">(необязательно)</span></FieldLabel>
          </div>
          <Input
            id="endTime"
            type="time"
            defaultValue="12:00"
            aria-invalid={Boolean(errors.endTime)}
            {...register("endTime")}
          />
          <FieldError id="endTime-error" message={errors.endTime?.message} />
        </div>
      </div>

      {/* 4. Сборная группа + Сколько вас */}
      <div className="grid gap-3">
        <div className="grid grid-cols-2 items-start gap-2">
          {/* Left: Сборная группа labeled toggle */}
          <div className="grid gap-2">
            <FieldLabel>Сборная группа</FieldLabel>
            <button
              type="button"
              onClick={() => {
                const current = form.getValues("mode");
                form.setValue("mode", current === "assembly" ? "private" : "assembly", {
                  shouldValidate: false,
                  shouldDirty: true,
                });
              }}
              className={cn(
                "flex h-10 w-full cursor-pointer select-none items-center justify-center rounded-md border text-sm font-medium transition-colors",
                isAssembly
                  ? "border-sky-200 bg-sky-100 text-sky-700"
                  : "border-purple-200 bg-purple-100 text-purple-700",
              )}
            >
              {isAssembly ? "Сборная" : "Своя"}
            </button>
          </div>

          {/* Right: groupSize */}
          <div className="grid gap-2">
            <FieldLabel htmlFor="groupSize">Сколько вас</FieldLabel>
            <Input
              id="groupSize"
              type="text"
              inputMode="numeric"
              placeholder="2"
              aria-invalid={Boolean(errors.groupSize)}
              {...register("groupSize", { valueAsNumber: true })}
            />
            <FieldError id="groupSize-error" message={errors.groupSize?.message} />
          </div>
        </div>

        {/* Budget — separate row, full-width */}
        <div className="grid gap-2">
          <FieldLabel htmlFor="budgetPerPersonRub">Бюджет на человека (₽)</FieldLabel>
          <Input
            id="budgetPerPersonRub"
            type="number"
            inputMode="numeric"
            min={1000}
            max={2000000}
            aria-invalid={Boolean(errors.budgetPerPersonRub)}
            aria-describedby="budgetPerPersonRub-total"
            {...register("budgetPerPersonRub", { valueAsNumber: true })}
          />
          <FieldError
            id="budgetPerPersonRub-error"
            message={errors.budgetPerPersonRub?.message}
          />
        </div>

        <TotalBudgetHint
          id="budgetPerPersonRub-total"
          perPerson={watchedBudgetPerPerson}
          groupSize={watchedGroupSize}
        />
      </div>

      {/* 7. Темы */}
      <div className="grid gap-2">
        <FieldLabel>Темы</FieldLabel>
        <div className="grid grid-cols-3 gap-2">
          {visibleThemes.map((theme) => {
            const selected = selectedInterests.includes(theme.slug);
            const Icon = theme.Icon;
            return (
              <button
                key={theme.slug}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  const current = interestsField.value;
                  const next = selected
                    ? current.filter((s) => s !== theme.slug)
                    : [...current, theme.slug];
                  interestsField.onChange(next);
                }}
                className={cn(
                  "flex w-full flex-row items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs transition-colors",
                  selected
                    ? "border-primary bg-primary/8 text-primary ring-2 ring-primary/40"
                    : "border-input bg-background text-muted-foreground hover:bg-muted/40",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="leading-tight">{theme.label}</span>
              </button>
            );
          })}
          {!showAllThemes && (
            <button
              type="button"
              onClick={() => setShowAllThemes(true)}
              className="col-span-3 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              Ещё темы →
            </button>
          )}
        </div>
        <FieldError id="interests-error" message={errors.interests?.message} />
      </div>

      {/* 8. Пожелания — expandable «+ Добавить детали», collapsed by default */}
      <details className="group rounded-xl border border-input bg-background open:bg-muted/30">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-foreground select-none [&::-webkit-details-marker]:hidden">
          <span aria-hidden="true" className="text-base leading-none group-open:hidden">+</span>
          <span aria-hidden="true" className="hidden text-base leading-none group-open:inline">−</span>
          <span>Добавить детали</span>
          <span className="text-muted-foreground font-normal">(выбрать язык, написать пожелания)</span>
        </summary>
        <div className="grid gap-3 px-3 pb-3 pt-1">
          <div className="grid gap-2">
            <FieldLabel>Языки экскурсии</FieldLabel>
            <LanguageMultiSelect
              options={LANGUAGES}
              value={requestedLanguagesField.value ?? []}
              onChange={requestedLanguagesField.onChange}
            />
          </div>
          <Textarea
            id="notes"
            placeholder="Особые пожелания, ограничения по здоровью или другие детали."
            aria-invalid={Boolean(errors.notes)}
            {...register("notes")}
          />
          <FieldError id="notes-error" message={errors.notes?.message} />
        </div>
      </details>

      {/* Server error */}
      {serverError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {serverError}
        </div>
      )}

      <HomepageAuthGate
        open={authGateOpen}
        onOpenChange={setAuthGateOpen}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* 9. Sticky submit button */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 p-4 backdrop-blur sm:relative sm:bottom-auto sm:inset-x-auto sm:border-t-0 sm:bg-transparent sm:p-0 sm:pt-8">
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Отправляем…" : "Отправить запрос гидам"}
        </Button>
      </div>
      </form>
    </TooltipProvider>
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

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs font-medium text-destructive">
      {message}
    </p>
  );
}

function TotalBudgetHint({
  id,
  perPerson,
  groupSize,
}: {
  id: string;
  perPerson: number | undefined;
  groupSize: number | undefined;
}) {
  const safePer =
    typeof perPerson === "number" && Number.isFinite(perPerson) && perPerson > 0
      ? perPerson
      : 0;
  const safeCount =
    typeof groupSize === "number" && Number.isFinite(groupSize) && groupSize > 0
      ? Math.floor(groupSize)
      : 0;
  if (safePer === 0 || safeCount === 0) {
    return (
      <p id={id} className="text-xs text-muted-foreground">
        Укажите бюджет и размер группы, чтобы увидеть итоговую сумму.
      </p>
    );
  }
  const total = safePer * safeCount;
  return (
    <p
      id={id}
      className="text-xs text-muted-foreground"
      aria-live="polite"
    >
      Итого: <span className="font-medium text-foreground">{total.toLocaleString("ru-RU")} ₽</span>
      {" "}за группу из {safeCount} {pluralizePeopleGenitive(safeCount)}.
    </p>
  );
}

function pluralizePeopleGenitive(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "человека";
  return "человек";
}
