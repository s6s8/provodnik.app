"use client";

import * as React from "react";
import { useController, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import { Command as CommandPrimitive } from "cmdk";
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
import { CommandItem, CommandList } from "@/components/ui/command";
import { FieldShell } from "@/components/ui/field-shell";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
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

/** Decorative field icon — every field carries a visible <Label>, so it is aria-hidden. */
function FieldIcon({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span className="flex shrink-0 items-center" aria-hidden="true">
      <Icon className={cn("size-4 text-muted-foreground", className)} />
    </span>
  );
}

/** 44px-square toggle inside a field shell — segment/pill controls share it. */
const TOGGLE_BASE =
  "grid size-11 shrink-0 cursor-pointer select-none place-items-center rounded-step border transition";
const TOGGLE_ON =
  "border-primary bg-primary text-primary-foreground ring-2 ring-primary/25 hover:bg-primary/90";
const TOGGLE_OFF = "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20";

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
  id,
  registration,
  ariaLabel,
}: {
  id: string;
  registration: UseFormRegisterReturn;
  ariaLabel: string;
}) {
  return (
    <input
      id={id}
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
  id,
  value,
  onChange,
  min,
  invalid,
  describedBy,
}: {
  id?: string;
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = isoToDate(value);
  const minDate = min ? isoToDate(min) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          aria-label="Когда"
          // ponytail: `aria-invalid` is rejected on role=button by jsx-a11y, so the
          // invalid state rides on data-invalid; the message is still announced via
          // the role="alert" node this control points at with aria-describedby.
          data-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className="w-full truncate text-left text-base font-bold leading-tight text-foreground outline-none data-[invalid]:text-destructive"
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

/**
 * Destination typeahead. The `<datalist>` it replaces filtered inconsistently
 * across browsers and could not be styled; cmdk supplies the real combobox
 * semantics (role, `aria-activedescendant`, arrow-key traversal, Enter to pick).
 *
 * The control is ASSISTIVE, never restrictive: the destination list is derived
 * from guide-entered free text and is therefore always incomplete, so the field
 * keeps accepting arbitrary input and submits it as typed.
 *
 * `asChild` keeps our own `id` on the input — cmdk hardcodes both `id` and
 * `aria-expanded: true` (true for an always-open command palette, a lie here) —
 * so the visible <Label htmlFor> still owns the field and the expanded state is
 * announced correctly.
 */
function DestinationCombobox({
  destinations,
  value,
  onChange,
  onBlur,
  inputRef,
  invalid,
  describedBy,
}: {
  destinations: DestinationOption[];
  value: string;
  onChange: (next: string) => void;
  onBlur: () => void;
  inputRef: React.Ref<HTMLInputElement>;
  invalid: boolean;
  describedBy?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const query = value.trim().toLocaleLowerCase("ru");
  const matches = query
    ? destinations.filter((d) => d.name.toLocaleLowerCase("ru").includes(query))
    : destinations;
  const listOpen = open && matches.length > 0;

  const choose = (name: string) => {
    onChange(name);
    setOpen(false);
  };

  return (
    // Filtering is ours (same ru-lowercase substring rule as TagMultiSelect), because
    // the match count decides whether the list opens at all.
    <CommandPrimitive label="Направление" shouldFilter={false} className="relative">
      <FieldShell>
        <FieldIcon icon={MapPin} className="text-primary" />
        <div className="min-w-0 flex-1">
          <CommandPrimitive.Input
            asChild
            value={value}
            onValueChange={(next) => {
              onChange(next);
              setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              else if (e.key === "ArrowDown" && !listOpen) setOpen(true);
              // With the list closed nothing is highlighted, so cmdk has nothing to
              // select — but its root swallows Enter unconditionally. Keep the event
              // away from it so free text still submits the form on Enter.
              else if (e.key === "Enter" && !listOpen) e.stopPropagation();
            }}
            onBlur={() => {
              setOpen(false);
              onBlur();
            }}
          >
            <input
              id="destination"
              ref={inputRef}
              className={cn(FIN, "text-lg")}
              placeholder="Куда едете?"
              // Restates the role cmdk applies at runtime — without it jsx-a11y reads a
              // bare textbox and rejects aria-expanded. The rule then wants aria-controls,
              // which cmdk injects itself (it points at the cmdk-generated list id).
              // eslint-disable-next-line jsx-a11y/role-has-required-aria-props
              role="combobox"
              aria-expanded={listOpen}
              aria-invalid={invalid}
              aria-describedby={describedBy}
            />
          </CommandPrimitive.Input>
        </div>
      </FieldShell>
      {listOpen ? (
        <div
          // Hold focus in the input so a pointer-picked option is not lost to blur.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute inset-x-0 top-full z-50 mt-1 rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
        >
          <CommandList>
            {matches.map((d) => (
              <CommandItem key={d.name} value={d.name} onSelect={() => choose(d.name)}>
                {d.name}
              </CommandItem>
            ))}
          </CommandList>
        </div>
      ) : null}
    </CommandPrimitive>
  );
}

const errorId = (field: string) => `request-${field}-error`;

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
  // cmdk's Input owns its own `onChange`, so `register()` cannot drive it —
  // the combobox goes through a controller instead.
  const { field: destinationField } = useController({
    control: form.control,
    name: "destination",
  });

  return (
    <form
      className="flex flex-col gap-3"
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
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="destination">Направление</Label>
        <DestinationCombobox
          destinations={destinations}
          value={destinationField.value ?? ""}
          onChange={destinationField.onChange}
          onBlur={destinationField.onBlur}
          inputRef={destinationField.ref}
          invalid={Boolean(errors.destination)}
          describedBy={errors.destination ? errorId("destination") : undefined}
        />
        <FieldError id={errorId("destination")} message={errors.destination?.message} />
      </div>

      {/* Когда · Гостей */}
      <div className="flex gap-2.5">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="startDate">Когда</Label>
          <FieldShell>
            <FieldIcon icon={CalendarIcon} />
            <div className="min-w-0 flex-1">
              <DateField
                id="startDate"
                value={startDate ?? ""}
                onChange={(iso) =>
                  form.setValue("startDate", iso, { shouldDirty: true, shouldValidate: true })
                }
                min={todayMoscowISODate()}
                invalid={Boolean(errors.startDate)}
                describedBy={errors.startDate ? errorId("startDate") : undefined}
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
              aria-label="Гибкие даты (±2–3 дня)"
              aria-pressed={dateFlexibility !== "exact"}
              className={cn(
                TOGGLE_BASE,
                "text-sm font-bold leading-none",
                dateFlexibility !== "exact" ? TOGGLE_ON : TOGGLE_OFF,
              )}
            >
              ≈
            </button>
          </FieldShell>
          <FieldError id={errorId("startDate")} message={errors.startDate?.message} />
        </div>

        <div className="flex w-40 flex-col gap-1.5">
          <Label htmlFor="groupSize">Гостей</Label>
          <FieldShell>
            <FieldIcon icon={Users} />
            <div className="min-w-0 flex-1">
              <input
                id="groupSize"
                className={FIN}
                inputMode="numeric"
                placeholder="2"
                aria-invalid={Boolean(errors.groupSize)}
                aria-describedby={errors.groupSize ? errorId("groupSize") : undefined}
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
              aria-label={
                isAssembly
                  ? "Открытая группа — нажмите, чтобы сделать закрытой"
                  : "Закрытая группа — нажмите, чтобы сделать открытой"
              }
              aria-pressed={!isAssembly}
              className={cn(TOGGLE_BASE, !isAssembly ? TOGGLE_ON : TOGGLE_OFF)}
            >
              {isAssembly ? (
                <LockOpen className="size-3.5" aria-hidden="true" />
              ) : (
                <Lock className="size-3.5" aria-hidden="true" />
              )}
            </button>
          </FieldShell>
          <FieldError id={errorId("groupSize")} message={errors.groupSize?.message} />
        </div>
      </div>

      {/* Время · Бюджет */}
      <div className="flex gap-2.5">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="startTime">Время</Label>
          <FieldShell>
            <FieldIcon icon={Clock} />
            <div className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <TimeField
                  id="startTime"
                  registration={register("startTime")}
                  ariaLabel="Время начала"
                />
                <span className="font-bold text-muted-foreground">–</span>
                <TimeField
                  id="endTime"
                  registration={register("endTime")}
                  ariaLabel="Время окончания"
                />
              </span>
            </div>
          </FieldShell>
        </div>

        <div className="flex w-40 flex-col gap-1.5">
          <Label htmlFor="budgetPerPersonRub">Бюджет, ₽ на человека</Label>
          <FieldShell>
            <FieldIcon icon={Wallet} />
            <div className="min-w-0 flex-1">
              <input
                id="budgetPerPersonRub"
                className={FIN}
                inputMode="numeric"
                placeholder="например, 5000"
                aria-invalid={Boolean(errors.budgetPerPersonRub)}
                aria-describedby={
                  errors.budgetPerPersonRub ? errorId("budgetPerPersonRub") : undefined
                }
                {...register("budgetPerPersonRub", { valueAsNumber: true })}
              />
            </div>
          </FieldShell>
          <FieldError
            id={errorId("budgetPerPersonRub")}
            message={errors.budgetPerPersonRub?.message}
          />
        </div>
      </div>

      {/* Темы · Языки */}
      <div className="grid grid-cols-2 gap-2.5">
        <Label className="flex-col items-start gap-1.5">
          Темы
          <ThemeMultiSelect
            value={selectedInterests}
            onChange={interestsField.onChange}
            leading={<FieldIcon icon={Tag} />}
          />
        </Label>
        <Label className="flex-col items-start gap-1.5">
          Языки экскурсии
          <LanguageMultiSelect
            options={LANGUAGES}
            value={requestedLanguagesField.value ?? []}
            onChange={requestedLanguagesField.onChange}
            placeholder="Языки"
            leading={<FieldIcon icon={Languages} />}
          />
        </Label>
      </div>
      <FieldError id={errorId("interests")} message={errors.interests?.message} />

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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Пожелания</Label>
          <Textarea
            id="notes"
            placeholder="Особые пожелания, ограничения по здоровью или другие детали."
            {...register("notes")}
          />
        </div>
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

      <Button type="submit" size="lg" loading={isLoading} className="mt-0.5 w-full">
        {isLoading ? null : <Send aria-hidden="true" strokeWidth={2.2} />}
        Найти гида
      </Button>
    </form>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs font-medium text-destructive">
      {message}
    </p>
  );
}
