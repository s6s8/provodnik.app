"use client";

import * as React from "react";
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
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { LANGUAGES } from "@/data/languages";
import { LanguageMultiSelect } from "@/components/shared/language-multi-select";
import { ThemeMultiSelect } from "@/components/shared/theme-multi-select";
import { Calendar } from "@/components/ui/calendar";
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
}

const FBX =
  "flex items-center gap-[11px] rounded-[13px] border border-border bg-surface px-[13px] py-[11px] transition-[border-color,box-shadow] focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(26,86,164,0.12)]";
const FIN_BASE =
  "border-0 bg-transparent p-0 text-[15.5px] font-bold leading-tight text-foreground outline-none placeholder:font-semibold placeholder:text-[#C2C9D3]";
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
          <Icon className={cn("h-[18px] w-[18px] text-muted-foreground", className)} />
        </span>
      </TooltipTrigger>
      <TooltipContent className="text-xs">{label}</TooltipContent>
    </Tooltip>
  );
}

function openPicker(e: React.MouseEvent<HTMLInputElement>) {
  e.currentTarget.showPicker?.();
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
function DateField({
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
          className="w-full truncate text-left text-[15.5px] font-bold leading-tight text-foreground outline-none"
        >
          {selected ? (
            selected.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
          ) : (
            <span className="font-semibold text-[#C2C9D3]">Когда</span>
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

export function HomepageRequestFormClassic({ destinations }: Props) {
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
  const startDate = form.watch("startDate");

  return (
    <TooltipProvider delayDuration={150}>
      <form
        className="flex flex-col gap-2.5"
        onSubmit={handleSubmit(submit)}
        aria-label="Создать запрос"
        noValidate
      >
        {/* Направление */}
        <div className={cn(FBX, "px-[15px]")}>
          <FieldIcon icon={MapPin} label="Направление" className="h-[21px] w-[21px] text-primary" />
          <div className="min-w-0 flex-1">
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

        {/* Когда · Гостей */}
        <div className="grid gap-2.5" style={{ gridTemplateColumns: "1fr 163px" }}>
          <div className={FBX}>
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
        <div className="grid gap-2.5" style={{ gridTemplateColumns: "1fr 163px" }}>
          <div className={FBX}>
            <FieldIcon icon={Clock} label="Время" />
            <div className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <input
                  className={cn(FIN_BASE, "native-picker-hidden w-auto")}
                  type="time"
                  aria-label="Время начала"
                  onClick={openPicker}
                  {...register("startTime")}
                />
                <span className="font-bold text-muted-foreground">–</span>
                <input
                  className={cn(FIN_BASE, "native-picker-hidden w-auto")}
                  type="time"
                  aria-label="Время окончания"
                  onClick={openPicker}
                  {...register("endTime")}
                />
              </span>
            </div>
          </div>

          <div className={FBX}>
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
          </div>
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
          className="inline-flex items-center gap-1.5 self-start whitespace-nowrap text-[11px] font-semibold text-ink-2"
        >
          <ChevronDown
            className={cn("h-[11px] w-[11px] transition-transform", detailsOpen && "rotate-180")}
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
    </TooltipProvider>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}
