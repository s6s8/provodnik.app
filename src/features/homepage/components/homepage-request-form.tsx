"use client";

import * as React from "react";
import { useForm, useController, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { LucideIcon } from "lucide-react";
import {
  Clock,
  Building2,
  Leaf,
  Utensils,
  Palette,
  Church,
  Baby,
  Sparkles,
} from "lucide-react";

import {
  travelerRequestSchema,
  type TravelerRequest,
} from "@/data/traveler-request/schema";
import { createRequestAction } from "@/app/(protected)/traveler/requests/new/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { todayMoscowISODate } from "@/lib/dates";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DestinationOption } from "@/data/supabase/queries";
import { HomepageAuthGate } from "./homepage-auth-gate";

type FormValues = TravelerRequest;

const INTEREST_OPTIONS: { slug: string; label: string; Icon: LucideIcon }[] = [
  { slug: "history", label: "История", Icon: Clock },
  { slug: "architecture", label: "Архитектура", Icon: Building2 },
  { slug: "nature", label: "Природа", Icon: Leaf },
  { slug: "food", label: "Гастрономия", Icon: Utensils },
  { slug: "art", label: "Искусство", Icon: Palette },
  { slug: "religion", label: "Религия", Icon: Church },
  { slug: "kids", label: "Для детей", Icon: Baby },
  { slug: "unusual", label: "Необычное", Icon: Sparkles },
];

interface Props {
  destinations: DestinationOption[];
}

export function HomepageRequestForm({ destinations }: Props) {
  const [authGateOpen, setAuthGateOpen] = React.useState(false);
  const [pendingFormData, setPendingFormData] = React.useState<FormData | null>(null);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(travelerRequestSchema),
    defaultValues: {
      mode: "private",
      interests: [] as string[],
      destination: "",
      startDate: "",
      dateFlexibility: "exact",
      startTime: "",
      endTime: "",
      groupSize: 2,
      groupSizeCurrent: 1,
      groupMax: undefined,
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
  const budget = useWatch({ control, name: "budgetPerPersonRub" });
  const groupSize = useWatch({ control, name: "groupSize" });
  const groupSizeCurrent = useWatch({ control, name: "groupSizeCurrent" });
  const isAssembly = mode === "assembly";
  const participants = isAssembly ? (groupSizeCurrent ?? 1) : (groupSize ?? 1);
  const validBudget = Number.isFinite(budget) && budget > 0 ? budget : null;
  const totalRub = validBudget !== null ? validBudget * (participants ?? 1) : null;

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
      {/* Mode toggle */}
      <div className="grid gap-2">
        <FieldLabel>Формат поездки</FieldLabel>
        <div className="flex gap-2">
          {(["private", "assembly"] as const).map((m) => (
            <label
              key={m}
              className={cn(
                "relative flex flex-1 cursor-pointer flex-col gap-1 rounded-xl border px-4 py-4 text-sm transition-colors",
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

      {/* Destination */}
      <div className="grid gap-2">
        <FieldLabel htmlFor="destination">Город</FieldLabel>
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

      {/* Date */}
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

      {/* Budget per person */}
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
        <FieldError
          id="budgetPerPersonRub-error"
          message={errors.budgetPerPersonRub?.message}
        />
      </div>

      {/* Interests */}
      <div className="grid gap-2">
        <FieldLabel>Интересы</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          {INTEREST_OPTIONS.map((opt) => {
            const selected = (interestsField.value as string[]).includes(opt.slug);
            return (
              <button
                key={opt.slug}
                type="button"
                onClick={() => {
                  const current = interestsField.value as string[];
                  const next = selected
                    ? current.filter((s) => s !== opt.slug)
                    : [...current, opt.slug];
                  interestsField.onChange(next);
                }}
                className={cn(
                  "flex flex-row items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs transition-colors",
                  selected
                    ? "border-primary bg-primary/8 text-primary"
                    : "border-input bg-background text-muted-foreground hover:bg-muted/40",
                )}
              >
                <opt.Icon className="h-5 w-5 shrink-0" />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Start time + end time */}
      <div className="grid gap-5 sm:grid-cols-2">
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

      {/* Group size — conditional on mode */}
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
            <FieldError
              id="groupSizeCurrent-error"
              message={errors.groupSizeCurrent?.message}
            />
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

      {/* Budget total display */}
      {totalRub !== null && (
        <div className="flex items-center justify-between rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Цена за группу</span>
          <span className="font-semibold text-foreground">
            {totalRub.toLocaleString("ru-RU")} ₽
          </span>
        </div>
      )}

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

      {/* Sticky submit button */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 p-4 backdrop-blur sm:relative sm:bottom-auto sm:inset-x-auto sm:border-t-0 sm:bg-transparent sm:p-0 sm:pt-8">
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Отправляем…" : "Отправить запрос гидам"}
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
