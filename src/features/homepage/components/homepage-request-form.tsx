"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useController, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  travelerRequestSchema,
  type TravelerRequest,
} from "@/data/traveler-request/schema";
import { THEMES } from "@/data/themes";
import { createRequestAction } from "@/app/(protected)/traveler/requests/new/actions";
import TrustStrip from "@/components/shared/TrustStrip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { todayMoscowISODate } from "@/lib/dates";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DestinationOption } from "@/data/supabase/queries";
import { HomepageAuthGate } from "./homepage-auth-gate";

type FormValues = TravelerRequest;

interface Props {
  destinations: DestinationOption[];
}

export function HomepageRequestForm({ destinations }: Props) {
  const router = useRouter();
  const [authGateOpen, setAuthGateOpen] = React.useState(false);
  const [pendingFormData, setPendingFormData] = React.useState<FormData | null>(null);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [allowGuideSuggestions, setAllowGuideSuggestions] = React.useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(travelerRequestSchema),
    defaultValues: {
      mode: "private",
      interests: [] as TravelerRequest["interests"],
      destination: process.env.NEXT_PUBLIC_PHASE_A_CITY ?? "Элиста",
      startDate: "",
      dateFlexibility: "exact",
      startTime: "",
      endTime: "",
      groupSize: 2,
      groupSizeCurrent: 1,
      allowGuideSuggestionsOutsideConstraints: true,
      budgetPerPersonRub: 5000,
      notes: "",
    },
    mode: "onTouched",
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = form;

  const { field: interestsField } = useController({ control, name: "interests" });

  const mode = useWatch({ control, name: "mode" });
  const isAssembly = mode === "assembly";
  const watchedGroupSize = useWatch({ control, name: "groupSize" });
  const watchedBudgetPerPerson = useWatch({ control, name: "budgetPerPersonRub" });

  async function submitWithFormData(fd: FormData) {
    setIsLoading(true);
    setServerError(null);
    try {
      const result = await createRequestAction({ error: null }, fd);
      if (result?.error) setServerError(result.error);
    } finally {
      setIsLoading(false);
    }
  }

  const onSubmit = async (values: FormValues) => {
    const fd = new FormData();
    fd.set("mode", values.mode);
    for (const i of values.interests) {
      fd.append("interests[]", i);
    }
    fd.set("destination", values.destination);
    fd.set("startDate", values.startDate);
    fd.set("startTime", values.startTime ?? "");
    fd.set("endTime", values.endTime ?? "");
    // Unified "Сколько вас" — write to groupSize always; when assembly,
    // mirror into groupSizeCurrent so the action's schema sees a value there too.
    const count = values.groupSize ?? 1;
    fd.set("groupSize", String(count));
    if (values.mode === "assembly") {
      fd.set("groupSizeCurrent", String(count));
    }
    // form-epic #14: bug 7 fix — do NOT push allowGuideSuggestionsOutsideConstraints
    // through FormData. The column may be absent from prod schema cache;
    // skipping the field lets the request insert succeed with its DB default.
    fd.set("budgetPerPersonRub", String(values.budgetPerPersonRub));
    fd.set("notes", values.notes ?? "");

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await submitWithFormData(fd);
      } else {
        setPendingFormData(fd);
        setAuthGateOpen(true);
      }
    } catch {
      setPendingFormData(fd);
      setAuthGateOpen(true);
    }
  };

  const handleAuthSuccess = async () => {
    setAuthGateOpen(false);
    // Refresh server components (SiteHeader, layout) so they pick up the new
    // auth state — without this, mobile hamburger drawer keeps showing "Войти"
    // after a successful in-page login (bug 5bcc6c22).
    router.refresh();
    if (pendingFormData) {
      await submitWithFormData(pendingFormData);
      setPendingFormData(null);
    }
  };

  return (
    <form
      className="grid gap-5 pb-24 sm:pb-0"
      onSubmit={handleSubmit(onSubmit)}
      aria-label="Создать запрос"
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

      {/* 3. Когда — date + start time + end time */}
      <div className="grid gap-2">
        <FieldLabel>Когда</FieldLabel>
        <div className="grid gap-3 sm:grid-cols-3 sm:items-end sm:gap-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="startDate">Дата</FieldLabel>
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
            <FieldLabel htmlFor="startTime">Начало</FieldLabel>
            <Input
              id="startTime"
              type="time"
              aria-invalid={Boolean(errors.startTime)}
              {...register("startTime")}
            />
            <FieldError id="startTime-error" message={errors.startTime?.message} />
          </div>
          <div className="grid gap-2">
            <FieldLabel htmlFor="endTime">Конец (необязательно)</FieldLabel>
            <Input
              id="endTime"
              type="time"
              aria-invalid={Boolean(errors.endTime)}
              {...register("endTime")}
            />
            <FieldError id="endTime-error" message={errors.endTime?.message} />
          </div>
        </div>
      </div>

      {/* 4. Сколько вас + opt-in companions toggle */}
      <div className="grid gap-3">
        <div className="grid gap-2">
          <FieldLabel htmlFor="groupSize">Сколько вас</FieldLabel>
          <Input
            id="groupSize"
            type="number"
            inputMode="numeric"
            min={1}
            max={20}
            aria-invalid={Boolean(errors.groupSize)}
            {...register("groupSize", { valueAsNumber: true })}
          />
          <FieldError id="groupSize-error" message={errors.groupSize?.message} />
        </div>

        <label className="flex items-start gap-2 cursor-pointer rounded-xl border border-input bg-background px-3 py-2.5 hover:bg-muted/40">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-primary"
            checked={isAssembly}
            onChange={(e) =>
              form.setValue("mode", e.target.checked ? "assembly" : "private", {
                shouldValidate: false,
                shouldDirty: true,
              })
            }
          />
          <span className="flex flex-col gap-0.5 text-sm">
            <span className="font-medium text-foreground">
              Открыт к увеличению группы
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2 cursor-pointer rounded-xl border border-input bg-background px-3 py-2.5 hover:bg-muted/40">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-primary"
            checked={allowGuideSuggestions}
            onChange={(e) => setAllowGuideSuggestions(e.target.checked)}
          />
          <span className="flex flex-col gap-0.5 text-sm">
            <span className="font-medium text-foreground">
              Разрешаю гидам предлагать близкие даты и время
            </span>
          </span>
        </label>
      </div>

      {/* 5. Бюджет на человека (₽) */}
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
        <TotalBudgetHint
          id="budgetPerPersonRub-total"
          perPerson={watchedBudgetPerPerson}
          groupSize={watchedGroupSize}
        />
        <FieldError
          id="budgetPerPersonRub-error"
          message={errors.budgetPerPersonRub?.message}
        />
      </div>

      {/* 6. Темы */}
      <div className="grid gap-2">
        <FieldLabel>Темы</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((theme) => {
            const selected = interestsField.value.includes(theme.slug);
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
                  "flex flex-row items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs transition-colors",
                  selected
                    ? "border-primary bg-primary/8 text-primary ring-2 ring-primary/40"
                    : "border-input bg-background text-muted-foreground hover:bg-muted/40",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{theme.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 7. Пожелания — expandable «+ Добавить детали», collapsed by default */}
      <details className="group rounded-xl border border-input bg-background open:bg-muted/30">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-foreground select-none [&::-webkit-details-marker]:hidden">
          <span aria-hidden="true" className="text-base leading-none group-open:hidden">+</span>
          <span aria-hidden="true" className="hidden text-base leading-none group-open:inline">−</span>
          <span>Добавить детали</span>
        </summary>
        <div className="grid gap-2 px-3 pb-3 pt-1">
          <Textarea
            id="notes"
            placeholder="Пожелания, ограничения, формат отчётных документов. Если оформляете от компании — укажите название юрлица, ИНН и нужны ли счёт/акт или оплата по реквизитам."
            aria-invalid={Boolean(errors.notes)}
            {...register("notes")}
          />
          <FieldHint>Пишите коротко — детали можно уточнить после первых откликов. Для заказа от юрлица добавьте сюда название компании, ИНН и тип документов.</FieldHint>
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

      {/* 8. Sticky submit button */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 p-4 backdrop-blur sm:relative sm:bottom-auto sm:inset-x-auto sm:border-t-0 sm:bg-transparent sm:p-0 sm:pt-8">
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Отправляем…" : "Отправить запрос гидам"}
        </Button>
      </div>
      <TrustStrip className="mt-6" />
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
  return <p {...props} className={cn("text-xs text-muted-foreground", className)} />;
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
      {" "}за группу из {safeCount} {pluralizePeople(safeCount)}.
    </p>
  );
}

function pluralizePeople(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "человек";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "человека";
  return "человек";
}
