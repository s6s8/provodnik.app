"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import type { OpenRequestRecord } from "@/data/open-requests/types";
import { submitTravelerRequest } from "@/data/traveler-request/submit";
import { createTravelerRequestPersistent } from "@/data/traveler-request/local-store";
import { travelerRequestSchema, type TravelerRequest } from "@/data/traveler-request/schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { PublicRequestCard } from "./public-request-card";

type RequestFormValues = TravelerRequest;

function parseCityRegion(destination: string) {
  const parts = destination
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const city = parts[0] ?? "";
  const region = parts.length > 1 ? parts.slice(1).join(", ") : undefined;
  return { city, region };
}

function formatDateRange(startDate: string, endDate: string) {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (!start && !end) return "—";
  const ruDayMonth = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
  });
  const yearFmt = new Intl.DateTimeFormat("ru-RU", { year: "numeric" });

  if (start && end) {
    const sameMonth = start.getMonth() === end.getMonth();
    const sameYear = start.getFullYear() === end.getFullYear();

    if (sameMonth && sameYear) {
      const month = new Intl.DateTimeFormat("ru-RU", { month: "short" }).format(start);
      return `${start.getDate()}–${end.getDate()} ${month}, ${yearFmt.format(start)}`;
    }

    return `${ruDayMonth.format(start)}–${ruDayMonth.format(end)}, ${yearFmt.format(
      end,
    )}`;
  }

  const one = start ?? end;
  return one ? `${ruDayMonth.format(one)}, ${yearFmt.format(one)}` : "—";
}

function buildPreviewOpenRequest(values: {
  destination: string;
  startDate: string;
  endDate: string;
  groupSize: number;
  budgetPerPersonRub: number;
  openToJoiningOthers: boolean;
  allowGuideSuggestionsOutsideConstraints: boolean;
}): OpenRequestRecord {
  const {
    city: rawCity,
    region: rawRegion,
  } = parseCityRegion(values.destination);
  const destinationTrimmed = values.destination.trim();

  const city = rawCity || (destinationTrimmed ? destinationTrimmed : "—");
  const region = rawRegion?.trim() ? rawRegion.trim() : undefined;

  const groupSizeSafe =
    Number.isFinite(values.groupSize) && values.groupSize > 0
      ? Math.max(1, Math.round(values.groupSize))
      : 2;

  const budgetSafe =
    Number.isFinite(values.budgetPerPersonRub) && values.budgetPerPersonRub > 0
      ? values.budgetPerPersonRub
      : undefined;

  const nowIso = new Date().toISOString();

  return {
    id: "or_preview_form",
    status: "forming_group",
    visibility: values.openToJoiningOthers ? "public" : "invite_only",
    createdAt: nowIso,
    updatedAt: nowIso,
    travelerRequestId: "req_preview_form",
    group: {
      sizeTarget: groupSizeSafe,
      sizeCurrent: 1,
      openToMoreMembers: values.openToJoiningOthers,
    },
    destinationLabel: city,
    regionLabel: region,
    dateRangeLabel: formatDateRange(values.startDate, values.endDate),
    budgetPerPersonRub: budgetSafe,
    priceScenarios: [],
    highlights: values.allowGuideSuggestionsOutsideConstraints
      ? ["Гиды могут предлагать варианты"]
      : ["Только в рамках запроса"],
  };
}

function ToggleButton(props: {
  pressed: boolean;
  title: string;
  description: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onToggle}
      aria-pressed={props.pressed}
      className={cn(
        "w-full rounded-full border px-5 py-3 text-left transition-all duration-200",
        props.pressed
          ? "border-primary/60 bg-primary/15 text-white"
          : "border-white/10 bg-white/5 text-white/65 hover:bg-white/10",
      )}
    >
      <div className="space-y-1">
        <div className="text-sm font-semibold">{props.title}</div>
        <div className="text-xs leading-4 text-white/60">{props.description}</div>
      </div>
    </button>
  );
}

export function CreateRequestForm() {
  const [savedMessage, setSavedMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(travelerRequestSchema),
    defaultValues: {
      // Hidden fields required by the schema:
      experienceType: "city",
      groupPreference: "private",

      // User-facing fields:
      destination: "",
      startDate: "",
      endDate: "",
      groupSize: 2,
      openToJoiningOthers: false,
      allowGuideSuggestionsOutsideConstraints: true,
      budgetPerPersonRub: 80_000,
      notes: "",
    },
    mode: "onTouched",
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = form;

  const watched = useWatch<RequestFormValues>({
    control,
    name: [
      "destination",
      "startDate",
      "endDate",
      "groupSize",
      "budgetPerPersonRub",
      "openToJoiningOthers",
      "allowGuideSuggestionsOutsideConstraints",
    ],
  });

  const [
    destination,
    startDate,
    endDate,
    groupSize,
    budgetPerPersonRub,
    openToJoiningOthers,
    allowGuideSuggestionsOutsideConstraints,
  ] = watched;

  const previewDestination =
    typeof destination === "string" ? destination : "";
  const previewStartDate = typeof startDate === "string" ? startDate : "";
  const previewEndDate = typeof endDate === "string" ? endDate : "";
  const previewGroupSize = typeof groupSize === "number" ? groupSize : 2;
  const previewBudgetPerPersonRub =
    typeof budgetPerPersonRub === "number" ? budgetPerPersonRub : 80_000;
  const previewOpenToJoiningOthers = openToJoiningOthers === true;
  const previewAllowGuideSuggestions =
    allowGuideSuggestionsOutsideConstraints !== false;

  const previewOpenRequest = React.useMemo(() => {
    // `useWatch` can briefly provide `undefined` while registering; keep preview stable.
    return buildPreviewOpenRequest({
      destination: previewDestination,
      startDate: previewStartDate,
      endDate: previewEndDate,
      groupSize: previewGroupSize,
      budgetPerPersonRub: previewBudgetPerPersonRub,
      openToJoiningOthers: previewOpenToJoiningOthers,
      allowGuideSuggestionsOutsideConstraints: previewAllowGuideSuggestions,
    });
  }, [
    previewDestination,
    previewStartDate,
    previewEndDate,
    previewGroupSize,
    previewBudgetPerPersonRub,
    previewOpenToJoiningOthers,
    previewAllowGuideSuggestions,
  ]);

  const onSubmit = React.useCallback(
    async (values: RequestFormValues) => {
      setSavedMessage(null);
      setIsSubmitting(true);
      try {
        const submission = await submitTravelerRequest(values);
        await createTravelerRequestPersistent(submission.request);
        setSavedMessage("Готово. Запрос сохранён локально на этом устройстве.");
      } catch {
        setSavedMessage("Не удалось сохранить запрос. Попробуйте ещё раз.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
      <form
        className="glass-panel rounded-[2rem] border border-white/10 p-6 sm:p-8"
        onSubmit={handleSubmit(onSubmit)}
        aria-label="Создать запрос"
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="destination" className="text-sm font-semibold text-white/80">
              Город / регион
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-white/55" />
              <Input
                id="destination"
                placeholder="Например: Казань, Татарстан"
                autoComplete="off"
                className="border-white/10 bg-white/5 text-white placeholder:text-white/40 pl-11"
                aria-invalid={Boolean(errors.destination)}
                {...register("destination")}
              />
            </div>
            {errors.destination ? (
              <p className="text-xs font-medium text-destructive">
                {errors.destination.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold text-white/80">Даты (диапазон)</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="startDate"
                  className="text-xs font-semibold text-white/70"
                >
                  Дата начала
                </label>
                <Input
                  id="startDate"
                  type="date"
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                  aria-invalid={Boolean(errors.startDate)}
                  {...register("startDate")}
                />
                {errors.startDate ? (
                  <p className="text-xs font-medium text-destructive">
                    {errors.startDate.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="endDate"
                  className="text-xs font-semibold text-white/70"
                >
                  Дата окончания
                </label>
                <Input
                  id="endDate"
                  type="date"
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                  aria-invalid={Boolean(errors.endDate)}
                  {...register("endDate")}
                />
                {errors.endDate ? (
                  <p className="text-xs font-medium text-destructive">
                    {errors.endDate.message}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="groupSize" className="text-sm font-semibold text-white/80">
              Количество участников
            </label>
            <Input
              id="groupSize"
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
              aria-invalid={Boolean(errors.groupSize)}
              {...register("groupSize", { valueAsNumber: true })}
            />
            {errors.groupSize ? (
              <p className="text-xs font-medium text-destructive">
                {errors.groupSize.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="budgetPerPersonRub"
              className="text-sm font-semibold text-white/80"
            >
              Целевой бюджет на человека
            </label>
            <div className="relative">
              <Input
                id="budgetPerPersonRub"
                type="number"
                inputMode="numeric"
                min={1000}
                max={2_000_000}
                className="border-white/10 bg-white/5 pr-14 text-white placeholder:text-white/40"
                aria-invalid={Boolean(errors.budgetPerPersonRub)}
                {...register("budgetPerPersonRub", { valueAsNumber: true })}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/60">
                ₽
              </span>
            </div>
            {errors.budgetPerPersonRub ? (
              <p className="text-xs font-medium text-destructive">
                {errors.budgetPerPersonRub.message}
              </p>
            ) : null}
          </div>

          <ToggleButton
            pressed={Boolean(openToJoiningOthers)}
            title="Открытая группа"
            description="Любой может присоединиться"
            onToggle={() => {
              const next = !openToJoiningOthers;
              setValue("openToJoiningOthers", next, { shouldValidate: true });
              setValue("groupPreference", next ? "group" : "private", {
                shouldValidate: true,
              });
            }}
          />

          <ToggleButton
            pressed={Boolean(allowGuideSuggestionsOutsideConstraints)}
            title="Принимать предложения от гидов"
            description="Разрешить варианты с небольшими сдвигами"
            onToggle={() => {
              setValue(
                "allowGuideSuggestionsOutsideConstraints",
                !allowGuideSuggestionsOutsideConstraints,
                { shouldValidate: true },
              );
            }}
          />

          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-semibold text-white/80">
              Описание (необязательно)
            </label>
            <Textarea
              id="notes"
              placeholder="Например: темп поездки, интересы, пожелания по логистике…"
              className="rounded-[1.2rem] border-white/10 bg-white/5 text-white placeholder:text-white/40"
              aria-invalid={Boolean(errors.notes)}
              {...register("notes")}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            variant="default"
            className="w-full rounded-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Создаём..." : "Создать запрос"}
          </Button>

          {savedMessage ? (
            <p className="text-sm text-white/70" role="status">
              {savedMessage}
            </p>
          ) : null}
        </div>
      </form>

      <aside className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight text-white">
          Как будет выглядеть ваш запрос
        </h3>
        <PublicRequestCard request={previewOpenRequest} />
      </aside>
    </div>
  );
}
