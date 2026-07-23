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
import { fetchDestinationSuggestionsAction } from "../actions/destination-suggestions-action";
import { useRequestForm } from "./use-request-form";
import type { TemplateRequestPrefill } from "./template-request-prefill";

interface Props {
  destinations: DestinationOption[];
  /** Guide preselected via "Запросить этого гида" on the guide's public page. */
  preferredGuide?: { slug: string; name: string; templateId?: string | null } | null;
  templatePrefill?: TemplateRequestPrefill | null;
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

/** Suggestions rendered at once. Precedent: tag-multi-select, requests marketplace. */
const MAX_SUGGESTIONS = 8;

/**
 * Destination typeahead. The `<datalist>` it replaces filtered inconsistently
 * across browsers and could not be styled; cmdk supplies the real combobox
 * semantics (role, `aria-activedescendant`, arrow-key traversal, Enter to pick).
 *
 * The control is ASSISTIVE, never restrictive: the destination list is derived
 * from guide-entered free text and is therefore always incomplete, so the field
 * keeps accepting arbitrary input and submits it as typed.
 *
 * The text field is deliberately native rather than `Command.Input`: cmdk moves
 * focus to its list whenever its selected item changes, including when deferred
 * suggestions commit. The root still handles arrow navigation and Enter through
 * bubbling, but it no longer owns focus in the text field.
 */
function DestinationCombobox({
  destinations,
  value,
  onChange,
  onBlur,
  onFocus,
  inputRef,
  invalid,
  describedBy,
}: {
  destinations: DestinationOption[];
  value: string;
  onChange: (next: string) => void;
  onBlur: () => void;
  onFocus?: () => void;
  inputRef: React.Ref<HTMLInputElement>;
  invalid: boolean;
  describedBy?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [activeOption, setActiveOption] = React.useState<string>();
  // The typed value stays immediate (it drives the input); only the filtering
  // work is deferred, so a keystroke never waits on the list to re-render.
  const deferredValue = React.useDeferredValue(value);
  const visible = React.useMemo(() => {
    const query = deferredValue.trim().toLocaleLowerCase("ru");
    const matched = query
      ? destinations.filter((d) => d.name.toLocaleLowerCase("ru").includes(query))
      : destinations;
    // The vocabulary is every listing city/region plus every approved guide's
    // places — unbounded by design. Render a shortlist; the field takes free
    // text anyway, so a longer list buys nothing and costs a frame per keystroke.
    return matched.slice(0, MAX_SUGGESTIONS);
  }, [destinations, deferredValue]);
  const listOpen = open && visible.length > 0;

  // Names that occur in more than one region among the shown matches — only
  // these need the region to tell them apart.
  const ambiguous = React.useMemo(() => {
    const dupes = new Set<string>();
    const seenNames = new Set<string>();
    for (const d of visible) {
      const k = d.name.toLocaleLowerCase("ru");
      if (seenNames.has(k)) dupes.add(k);
      seenNames.add(k);
    }
    return dupes;
  }, [visible]);

  const choose = (name: string) => {
    onChange(name);
    setOpen(false);
  };

  return (
    // Filtering is ours (same ru-lowercase substring rule as TagMultiSelect), because
    // the match count decides whether the list opens at all.
    <CommandPrimitive
      label="Направление"
      shouldFilter={false}
      onValueChange={setActiveOption}
      className="relative"
    >
      <FieldShell>
        <FieldIcon icon={MapPin} className="text-primary" />
        <div className="min-w-0 flex-1">
          <input
            id="destination"
            ref={inputRef}
            className={cn(FIN, "text-lg")}
            placeholder="Куда едете?"
            // Cap input length at the schema's max so a destination label can
            // never be pasted unbounded (matches the 80-char Zod/DB contract).
            maxLength={80}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
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
            onFocus={() => {
              onFocus?.();
              setOpen(true);
            }}
            onBlur={() => {
              setOpen(false);
              onBlur();
            }}
            role="combobox"
            aria-autocomplete="list"
            aria-controls="destination-suggestions"
            aria-activedescendant={activeOption ? `destination-option-${activeOption}` : undefined}
            aria-expanded={listOpen}
            aria-invalid={invalid}
            aria-describedby={describedBy}
          />
        </div>
      </FieldShell>
      {/*
        Stays mounted and toggles `hidden` rather than mounting on open: mounting
        cmdk's list steals focus out of the input, so a conditional render moved
        focus on the keystroke that produced the first match — the reported "have
        to click the field again to keep typing". `hidden` also drops the listbox
        out of the accessibility tree, so nothing is announced while it is closed.
      */}
      <div
        hidden={!listOpen}
        // Hold focus in the input so a pointer-picked option is not lost to blur.
        onMouseDown={(e) => e.preventDefault()}
        className="absolute inset-x-0 top-full z-50 mt-1 rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
      >
        <CommandList id="destination-suggestions">
          {visible.map((d) => {
            // Unique cmdk value per (name, region): two places sharing a name in
            // different regions must not collide. Value is not the accessible
            // name (that comes from the text), so single-region options still
            // read as a bare name. Selecting always stores the plain name.
            const optionValue = d.region ? `${d.name} · ${d.region}` : d.name;
            const showRegion = Boolean(d.region) && ambiguous.has(d.name.toLocaleLowerCase("ru"));
            return (
              <CommandItem
                key={optionValue}
                id={`destination-option-${optionValue}`}
                value={optionValue}
                onSelect={() => choose(d.name)}
              >
                {d.name}
                {showRegion ? (
                  <span className="ml-1.5 text-muted-foreground">· {d.region}</span>
                ) : null}
              </CommandItem>
            );
          })}
        </CommandList>
      </div>
    </CommandPrimitive>
  );
}

const errorId = (field: string) => `request-${field}-error`;

export function HomepageRequestFormClassic({
  destinations,
  preferredGuide,
  templatePrefill,
}: Props) {
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [guideAttached, setGuideAttached] = React.useState(true);
  const attachedGuide = guideAttached ? preferredGuide ?? null : null;
  const [destinationOptions, setDestinationOptions] = React.useState(destinations);
  const suggestionsRequest = React.useRef<Promise<void> | null>(null);

  const ensureDestinationSuggestions = React.useCallback(() => {
    if (suggestionsRequest.current) return;
    suggestionsRequest.current = (async () => {
      const result = await fetchDestinationSuggestionsAction();
      if (result.ok && result.data.length > 0) setDestinationOptions(result.data);
    })();
  }, []);

  React.useEffect(() => {
    setDestinationOptions(destinations);
  }, [destinations]);

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
  } = useRequestForm({
    preferredGuideSlug: attachedGuide?.slug ?? null,
    // Detaching the guide detaches the excursion with it — the request must not keep
    // claiming a template whose guide the traveler just removed.
    preferredTemplateId: attachedGuide?.templateId ?? null,
    templatePrefill,
  });
  const startDate = useWatch({ control: form.control, name: "startDate" });
  const timeFlexible = dateFlexibility !== "exact";
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

      {/* Направление — relative z-20 lifts this block (and its suggestion
          popover) into a stacking context above the following «Когда» row, so a
          suggestion is hit-testable instead of being intercepted by the date
          label that follows it in DOM order. */}
      <div className="relative z-20 flex flex-col gap-1.5">
        <Label htmlFor="destination">Направление</Label>
        <DestinationCombobox
          destinations={destinationOptions}
          value={destinationField.value ?? ""}
          onChange={destinationField.onChange}
          onBlur={destinationField.onBlur}
          onFocus={ensureDestinationSuggestions}
          inputRef={destinationField.ref}
          invalid={Boolean(errors.destination)}
          describedBy={errors.destination ? errorId("destination") : undefined}
        />
        <FieldError id={errorId("destination")} message={errors.destination?.message} />
      </div>

      {/* Когда · Гостей — stacked at 375px, side by side from `sm` up.
          These two do not fit on one line on a phone. As a plain `flex` row, `w-40` was
          only a basis and the right column became the shock absorber: picking a date
          grows the left column's content («Когда» → «2 августа» + the ≈ toggle), the
          whole deficit landed on the right, and «Гостей» collapsed to ZERO width — on a
          phone the traveler could no longer see or type the guest count after choosing
          dates. Pinning it with `shrink-0` instead just moved the failure: the row then
          overflowed the card. Stacking is the only thing that actually fits.
          Same construct, same fix in the «Время · Бюджет» row below. */}
      <div className="flex flex-col gap-2.5 sm:flex-row">
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
                const next = current === "exact" ? "few_days" : "exact";
                form.setValue("dateFlexibility", next, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                if (next === "few_days") {
                  form.setValue("startTime", "", { shouldDirty: true, shouldValidate: true });
                  form.setValue("endTime", "", { shouldDirty: true, shouldValidate: true });
                } else {
                  form.setValue("startTime", "10:00", { shouldDirty: true, shouldValidate: true });
                  form.setValue("endTime", "12:00", { shouldDirty: true, shouldValidate: true });
                }
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

        <div className="flex w-full flex-col gap-1.5 sm:w-40 sm:shrink-0">
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
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor={timeFlexible ? "time-flexible" : "startTime"}>Время</Label>
          <FieldShell>
            <FieldIcon icon={Clock} />
            <div className="min-w-0 flex-1">
              {timeFlexible ? (
                <span
                  id="time-flexible"
                  className="block py-2 text-sm font-medium text-muted-foreground"
                >
                  Гибкое время
                </span>
              ) : (
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
              )}
            </div>
          </FieldShell>
          {!timeFlexible ? (
            <>
              <FieldError id={errorId("startTime")} message={errors.startTime?.message} />
              <FieldError id={errorId("endTime")} message={errors.endTime?.message} />
            </>
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-1.5 sm:w-40 sm:shrink-0">
          <Label htmlFor="budgetPerPersonRub">Бюджет, ₽ на человека</Label>
          <FieldShell>
            <FieldIcon icon={Wallet} />
            <div className="min-w-0 flex-1">
              <input
                id="budgetPerPersonRub"
                className={FIN}
                inputMode="numeric"
                // Hard cap keystrokes above the Zod ceiling (max 2 000 000 ₽ is
                // 7 digits); server-side Zod stays the source of truth.
                maxLength={9}
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
