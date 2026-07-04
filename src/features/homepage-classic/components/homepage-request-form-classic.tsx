"use client";

import * as React from "react";
import { useWatch, type UseFormRegisterReturn } from "react-hook-form";
import { ru } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Clock,
  Languages,
  Lock,
  LockOpen,
  MapPin,
  Send,
  Tag,
  UserCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { LANGUAGES } from "@/data/languages";
import { LanguageMultiSelect } from "@/components/shared/language-multi-select";
import { ThemeMultiSelect } from "@/components/shared/theme-multi-select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FieldShell } from "@/components/ui/field-shell";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { todayMoscowISODate } from "@/lib/dates";
import type { DestinationOption } from "@/data/supabase/queries";
import { HomepageAuthGate } from "./homepage-auth-gate";
import { useRequestForm } from "./use-request-form";

interface Props {
  destinations: DestinationOption[];
  /** Guide preselected via "Запросить этого гида" on the guide's public page. */
  preferredGuide?: { slug: string; name: string } | null;
}

const FIN_BASE =
  "border-0 bg-transparent p-0 text-base font-bold leading-tight text-foreground outline-none placeholder:font-semibold placeholder:text-placeholder";
const FIN = cn(FIN_BASE, "w-full");

/** Field icon + hover tooltip (labels are otherwise hidden for a clean look). */
function FieldIcon({
  icon: Icon,
  label,
  className,
}: {
  icon: LucideIcon;
  label: string;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex shrink-0 cursor-default items-center" aria-hidden="true">
          <Icon className={cn("size-4 text-muted-foreground", className)} />
        </span>
      </TooltipTrigger>
      <TooltipContent className="text-xs">{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Normalise free typed digits into a 24h "HH:MM" string. Native
 * `<input type="time">` renders AM/PM under non-RU browser locales (and ignores
 * the `lang` attribute in some Chromium builds), so we drive a plain text field
 * to guarantee 24h display for this Russian-language product.
 */
function formatTime(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  let h = Number(digits.slice(0, 2));
  if (h > 23) h = 23;
  const hh = String(h).padStart(2, "0");
  const minRaw = digits.slice(2);
  // Keep a half-typed minute ("08:1") un-padded so the second digit still fits
  // under maxLength; only pad/clamp once both minute digits are present.
  if (minRaw.length === 1) return `${hh}:${minRaw}`;
  const m = Math.min(Number(minRaw), 59);
  return `${hh}:${String(m).padStart(2, "0")}`;
}

function TimeField({
  registration,
  ariaLabel,
}: {
  registration: UseFormRegisterReturn;
  ariaLabel: string;
}) {
  return (
    <input
      className={cn(FIN_BASE, "w-[3.25rem] tabular-nums")}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="10:00"
      maxLength={5}
      aria-label={ariaLabel}
      {...registration}
      onChange={(e) => {
        e.target.value = formatTime(e.target.value);
        return registration.onChange(e);
      }}
    />
  );
}

function isoToDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function dateToISO(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

/** Custom date field — a calendar popover (Russian, no native widget jitter). */
export function DateField({
  value,
  onChange,
  min,
}: {
  value: string;
  onChange: (iso: string) => void;
  min?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = isoToDate(value);
  const minDate = min ? isoToDate(min) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Когда"
          className="w-full truncate text-left text-base font-bold leading-tight text-foreground outline-none"
        >
          {selected ? (
            selected.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
          ) : (
            <span className="font-semibold text-placeholder">Когда</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          locale={ru}
          selected={selected}
          onSelect={(d) => {
            if (d) {
              onChange(dateToISO(d));
              setOpen(false);
            }
          }}
          disabled={minDate ? { before: minDate } : undefined}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export function HomepageRequestFormClassic({ destinations, preferredGuide }: Props) {
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [guideAttached, setGuideAttached] = React.useState(true);
  const attachedGuide = guideAttached ? preferredGuide ?? null : null;
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
  } = useRequestForm({ preferredGuideSlug: attachedGuide?.slug ?? null });
  const startDate = useWatch({ control: form.control, name: "startDate" });

  return (
    <TooltipProvider delayDuration={150}>
      <form
        className="flex flex-col gap-2.5"
        onSubmit={handleSubmit(submit)}
        aria-label="Создать запрос"
        noValidate
      >
        {attachedGuide ? (
          <div className="flex items-center justify-between gap-2 rounded-step border border-primary/40 bg-primary/10 px-3 py-2">
            <span className="inline-flex min-w-0 items-center gap-1.5 text-sm font-semibold text-primary">
              <UserCheck className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">Запрос гиду: {attachedGuide.name}</span>
            </span>
            <button
              type="button"
              onClick={() => setGuideAttached(false)}
              aria-label="Убрать выбранного гида"
              className="grid size-6 shrink-0 cursor-pointer place-items-center rounded-full text-primary transition hover:bg-primary/20"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        ) : null}
        {/* Направление */}
        <FieldShell>
          <FieldIcon icon={MapPin} label="Направление" className="text-primary" />
          <div className="min-w-0 flex-1">
            <input
              className={cn(FIN, "text-lg")}
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
        </FieldShell>
        <FieldError message={errors.destination?.message} />

        {/* Когда · Гостей */}
        <div className="flex gap-2.5">
          <FieldShell className="flex-1">
            <FieldIcon icon={CalendarIcon} label="Когда" />
            <div className="min-w-0 flex-1">
              <DateField
                value={startDate ?? ""}
                onChange={(iso) =>
                  form.setValue("startDate", iso, { shouldDirty: true, shouldValidate: true })
                }
                min={todayMoscowISODate()}
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
                "grid size-8 shrink-0 cursor-pointer select-none place-items-center rounded-step border text-sm font-bold leading-none transition",
                dateFlexibility !== "exact"
                  ? "border-primary bg-primary text-white ring-2 ring-primary/25 hover:bg-primary/90"
                  : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20",
              )}
            >
              ≈
            </button>
          </FieldShell>

          <FieldShell className="w-40">
            <FieldIcon icon={Users} label="Гостей" />
            <div className="min-w-0 flex-1">
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
                "grid size-8 shrink-0 cursor-pointer select-none place-items-center rounded-step border transition",
                !isAssembly
                  ? "border-primary bg-primary text-white ring-2 ring-primary/25 hover:bg-primary/90"
                  : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20",
              )}
            >
              {isAssembly ? (
                <LockOpen className="size-3.5" aria-hidden="true" />
              ) : (
                <Lock className="size-3.5" aria-hidden="true" />
              )}
            </button>
          </FieldShell>
        </div>

        {/* Время · Бюджет */}
        <div className="flex gap-2.5">
          <FieldShell className="flex-1">
            <FieldIcon icon={Clock} label="Время" />
            <div className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <TimeField registration={register("startTime")} ariaLabel="Время начала" />
                <span className="font-bold text-muted-foreground">–</span>
                <TimeField registration={register("endTime")} ariaLabel="Время окончания" />
              </span>
            </div>
          </FieldShell>

          <FieldShell className="w-40">
            <FieldIcon icon={Wallet} label="Бюджет ₽/чел" />
            <div className="min-w-0 flex-1">
              <input
                className={FIN}
                inputMode="numeric"
                aria-label="Бюджет на человека"
                aria-invalid={Boolean(errors.budgetPerPersonRub)}
                {...register("budgetPerPersonRub", { valueAsNumber: true })}
              />
            </div>
          </FieldShell>
        </div>
        <FieldError
          message={
            errors.startDate?.message ?? errors.groupSize?.message ?? errors.budgetPerPersonRub?.message
          }
        />

        {/* Темы · Языки */}
        <div className="grid grid-cols-2 gap-2.5">
          <ThemeMultiSelect
            value={selectedInterests}
            onChange={interestsField.onChange}
            leading={<FieldIcon icon={Tag} label="Темы" />}
          />
          <LanguageMultiSelect
            options={LANGUAGES}
            value={requestedLanguagesField.value ?? []}
            onChange={requestedLanguagesField.onChange}
            placeholder="Языки"
            leading={<FieldIcon icon={Languages} label="Языки экскурсии" />}
          />
        </div>
        <FieldError message={errors.interests?.message} />

        {/* Детали → пожелания */}
        <button
          type="button"
          onClick={() => setDetailsOpen((o) => !o)}
          aria-expanded={detailsOpen}
          className="inline-flex items-center gap-1.5 self-start whitespace-nowrap text-xs font-semibold text-ink-2"
        >
          <ChevronDown
            className={cn("size-3 transition-transform", detailsOpen && "rotate-180")}
            aria-hidden="true"
          />
          Детали
        </button>
        {detailsOpen && (
          <Textarea
            id="notes"
            aria-label="Пожелания"
            placeholder="Особые пожелания, ограничения по здоровью или другие детали."
            {...register("notes")}
          />
        )}

        {serverError && (
          <div
            role="alert"
            className="rounded-step border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {serverError}
          </div>
        )}

        <HomepageAuthGate
          open={authGateOpen}
          onOpenChange={setAuthGateOpen}
          onAuthSuccess={handleAuthSuccess}
        />

        <Button type="submit" size="lg" disabled={isLoading} className="mt-0.5 w-full">
          <Send aria-hidden="true" strokeWidth={2.2} />
          {isLoading ? "Отправляем…" : "Найти гида"}
        </Button>
      </form>
    </TooltipProvider>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}
