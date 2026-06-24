"use client";

import * as React from "react";
import {
  Calendar,
  ChevronDown,
  Clock,
  Lock,
  LockOpen,
  MapPin,
  Send,
  Users,
  Wallet,
} from "lucide-react";

import { LANGUAGES } from "@/data/languages";
import { THEMES } from "@/data/themes";
import { LanguageMultiSelect } from "@/components/shared/language-multi-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { todayMoscowISODate } from "@/lib/dates";
import type { DestinationOption } from "@/data/supabase/queries";
import { HomepageAuthGate } from "./homepage-auth-gate";
import { useRequestForm } from "./use-request-form";

interface Props {
  destinations: DestinationOption[];
}

const FBX =
  "flex items-center gap-[11px] rounded-[13px] border border-border bg-surface px-[13px] py-[9px] transition-[border-color,box-shadow] focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(26,86,164,0.12)]";
const KIN =
  "mb-[3px] block text-[9.5px] font-bold uppercase leading-none tracking-[0.07em] text-muted-foreground";
const FIN =
  "w-full border-0 bg-transparent p-0 text-[15.5px] font-bold leading-tight text-foreground outline-none placeholder:font-semibold placeholder:text-[#C2C9D3]";

export function HomepageRequestFormClassic({ destinations }: Props) {
  const [showAllThemes, setShowAllThemes] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const {
    form,
    register,
    handleSubmit,
    errors,
    interestsField,
    requestedLanguagesField,
    isAssembly,
    dateFlexibility,
    selectedInterests,
    submit,
    authGateOpen,
    setAuthGateOpen,
    handleAuthSuccess,
    serverError,
    isLoading,
  } = useRequestForm();
  const visibleThemes = showAllThemes ? THEMES : THEMES.slice(0, 4);

  return (
    <form
      className="flex flex-col gap-2.5"
      onSubmit={handleSubmit(submit)}
      aria-label="Создать запрос"
      noValidate
    >
      {/* Направление */}
      <div className={cn(FBX, "px-[15px] py-[11px]")}>
        <MapPin className="h-[21px] w-[21px] shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <span className={KIN} aria-hidden="true">Направление</span>
          <input
            className={cn(FIN, "text-[18px]")}
            list="destination-options"
            placeholder="Куда едете?"
            autoComplete="off"
            aria-label="Направление"
            aria-invalid={Boolean(errors.destination)}
            {...register("destination")}
          />
          <datalist id="destination-options">
            {destinations.map((d) => (
              <option key={d.name} value={d.name} />
            ))}
          </datalist>
        </div>
      </div>
      <FieldError message={errors.destination?.message} />

      {/* Когда + гибкость · Гостей + замок */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className={FBX}>
          <Calendar className="h-[18px] w-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <span className={KIN} aria-hidden="true">Когда</span>
            <input
              className={FIN}
              type="date"
              min={todayMoscowISODate()}
              aria-label="Когда"
              aria-invalid={Boolean(errors.startDate)}
              {...register("startDate")}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              const current = form.getValues("dateFlexibility");
              form.setValue("dateFlexibility", current === "exact" ? "few_days" : "exact", {
                shouldDirty: true,
              });
            }}
            title="Гибкие даты (±2–3 дня)"
            aria-label="Переключить гибкие даты"
            aria-pressed={dateFlexibility !== "exact"}
            className={cn(
              "grid h-[30px] w-[30px] shrink-0 cursor-pointer select-none place-items-center rounded-lg border text-sm font-bold leading-none transition",
              dateFlexibility !== "exact"
                ? "border-primary bg-primary text-white shadow-[0_0_0_3px_rgba(26,86,164,0.18)] hover:bg-primary/90"
                : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20",
            )}
          >
            ≈
          </button>
        </div>

        <div className={FBX}>
          <Users className="h-[18px] w-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <span className={KIN} aria-hidden="true">Гостей</span>
            <input
              className={FIN}
              inputMode="numeric"
              placeholder="2"
              aria-label="Гостей"
              aria-invalid={Boolean(errors.groupSize)}
              {...register("groupSize", { valueAsNumber: true })}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              const current = form.getValues("mode");
              form.setValue("mode", current === "assembly" ? "private" : "assembly", {
                shouldValidate: false,
                shouldDirty: true,
              });
            }}
            title={isAssembly ? "Открытая группа (сборная)" : "Закрытая группа (своя)"}
            aria-label={
              isAssembly
                ? "Открытая группа — нажмите, чтобы сделать закрытой"
                : "Закрытая группа — нажмите, чтобы сделать открытой"
            }
            aria-pressed={!isAssembly}
            className={cn(
              "grid h-[30px] w-[30px] shrink-0 cursor-pointer select-none place-items-center rounded-lg border transition",
              !isAssembly
                ? "border-primary bg-primary text-white shadow-[0_0_0_3px_rgba(26,86,164,0.18)] hover:bg-primary/90"
                : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20",
            )}
          >
            {isAssembly ? (
              <LockOpen className="h-[14px] w-[14px]" aria-hidden="true" />
            ) : (
              <Lock className="h-[14px] w-[14px]" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Время · Бюджет */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className={FBX}>
          <Clock className="h-[18px] w-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <span className={KIN} aria-hidden="true">Время</span>
            <span className="flex items-center gap-1.5">
              <input
                className={cn(FIN, "w-[58px]")}
                type="time"
                aria-label="Время начала"
                {...register("startTime")}
              />
              <span className="font-bold text-muted-foreground">–</span>
              <input
                className={cn(FIN, "w-[58px]")}
                type="time"
                aria-label="Время окончания"
                {...register("endTime")}
              />
            </span>
          </div>
        </div>

        <div className={FBX}>
          <Wallet className="h-[18px] w-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <span className={KIN} aria-hidden="true">Бюджет ₽/чел</span>
            <input
              className={FIN}
              inputMode="numeric"
              aria-label="Бюджет на человека"
              aria-invalid={Boolean(errors.budgetPerPersonRub)}
              {...register("budgetPerPersonRub", { valueAsNumber: true })}
            />
          </div>
        </div>
      </div>
      <FieldError message={errors.groupSize?.message ?? errors.budgetPerPersonRub?.message} />

      {/* Темы (чипы) + Детали */}
      <div className="mt-0.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
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
                  interestsField.onChange(
                    selected ? current.filter((s) => s !== theme.slug) : [...current, theme.slug],
                  );
                }}
                className={cn(
                  "inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold transition",
                  selected
                    ? "border-primary bg-primary/10 text-primary shadow-[0_0_0_3px_rgba(26,86,164,0.12)]"
                    : "border-border bg-surface text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                <Icon className="h-2.5 w-2.5" aria-hidden="true" />
                {theme.label}
              </button>
            );
          })}
          {!showAllThemes && (
            <button
              type="button"
              onClick={() => setShowAllThemes(true)}
              className="inline-flex h-6 items-center rounded-full border border-primary/30 px-2.5 text-[11px] font-semibold text-primary transition hover:bg-primary/10"
            >
              Ещё
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setDetailsOpen((open) => !open)}
          aria-expanded={detailsOpen}
          className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold text-ink-2"
        >
          <ChevronDown
            className={cn("h-[11px] w-[11px] transition-transform", detailsOpen && "rotate-180")}
            aria-hidden="true"
          />
          Детали
        </button>
      </div>
      <FieldError message={errors.interests?.message} />

      {/* Детали */}
      {detailsOpen && (
        <div className="flex flex-col gap-3">
          <div>
            <span className={cn(KIN, "mb-1.5")} aria-hidden="true">Языки экскурсии</span>
            <LanguageMultiSelect
              options={LANGUAGES}
              value={requestedLanguagesField.value ?? []}
              onChange={requestedLanguagesField.onChange}
            />
          </div>
          <div>
            <span className={cn(KIN, "mb-1.5")} aria-hidden="true">Пожелания</span>
            <Textarea
              id="notes"
              aria-label="Пожелания"
              placeholder="Особые пожелания, ограничения по здоровью или другие детали."
              {...register("notes")}
            />
          </div>
        </div>
      )}

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

      <button
        type="submit"
        disabled={isLoading}
        className="mt-0.5 inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-[13px] bg-primary text-[15px] font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Send className="h-[18px] w-[18px]" aria-hidden="true" strokeWidth={2.2} />
        {isLoading ? "Отправляем…" : "Найти гида"}
      </button>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}
