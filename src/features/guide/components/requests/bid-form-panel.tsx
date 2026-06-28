"use client";

import * as React from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Lock, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { INTEREST_CHIPS } from "@/data/interests";
import { kopecksToRub } from "@/data/money";
import type { RequestRecord } from "@/data/supabase/queries";
import { submitOfferAction, editOfferAction } from "@/features/guide/offer-actions";
import type { SubmitOfferResult } from "@/features/guide/offer-action-types";
import type { GuideOfferRow, GuideTemplateRow } from "@/lib/supabase/types";
import { useGuideCatalog } from "./use-guide-catalog";

type RouteStop = { photoId: string; locationName: string; photoUrl: string; sortOrder: number };
type CatalogRouteTab = "catalog" | "route";

const INTEREST_LABEL_BY_ID: Record<string, string> = Object.fromEntries(
  INTEREST_CHIPS.map(({ id, label }) => [id, label]),
);

const offerFormSchema = z.object({
  price_total: z
    .number()
    .int("Используйте целое число.")
    .min(1_000, "Цена должна быть не менее 1 000 ₽.")
    .max(10_000_000, "Цена слишком высокая."),
  price_per_person: z.number().int().min(1).max(10_000_000).optional(),
  message: z
    .string()
    .trim()
    .min(10, "Сообщение должно содержать минимум 10 символов.")
    .max(2_000, "Сообщение не должно превышать 2 000 символов."),
  valid_until: z
    .string()
    .min(1, "Укажите дату действия предложения.")
    .refine((v) => {
      const d = new Date(v);
      return !Number.isNaN(d.getTime()) && d > new Date();
    }, "Дата должна быть в будущем."),
  excursion_date: z.string().optional(),
  excursion_start_time: z.string().optional(),
  excursion_end_time: z.string().optional(),
  headcount: z.number().int().min(1).max(50).optional(),
});

type OfferFormValues = z.infer<typeof offerFormSchema>;


function getDefaultValidUntil(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow" }).format(d);
}

const FIELD_CLASS =
  "min-h-[2.75rem] w-full rounded-xl border border-border bg-surface-high px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary";

function ProposedBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
      ↔️ предложено
    </span>
  );
}

interface BidFormPanelProps {
  requestId: string;
  request: RequestRecord;
  editOffer?: GuideOfferRow;
  onClose: () => void;
  onSuccess?: () => void;
}

const mskParts = (iso: string | null | undefined) => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const m = new Date(t + 3 * 60 * 60 * 1000).toISOString();
  return { date: m.slice(0, 10), time: m.slice(11, 16) };
};

export function BidFormPanel({
  requestId,
  request,
  editOffer,
  onClose,
  onSuccess,
}: BidFormPanelProps) {
  const isEdit = !!editOffer;
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);
  const submitInFlight = React.useRef(false);
  const { guidePhotos, guideTemplates, guideVerificationStatus } = useGuideCatalog();
  const [selectedExcursion, setSelectedExcursion] = React.useState<GuideTemplateRow | null>(null);
  const [excursionPickerOpen, setExcursionPickerOpen] = React.useState(false);
  const [routeStops, setRouteStops] = React.useState<RouteStop[]>(
    Array.isArray(editOffer?.route_stops) ? (editOffer.route_stops as RouteStop[]) : [],
  );
  const [activeCatalogRouteTab, setActiveCatalogRouteTab] = React.useState<CatalogRouteTab>("catalog");

  const travelerDate = request.startsOn ? request.startsOn.slice(0, 10) : "";
  const travelerCount = request.groupSize > 0 ? request.groupSize : 1;
  const dateLocked = request.dateFlexibility === "few_days" ? false : (request.date_locked ?? true);
  const timeLocked = request.time_locked ?? true;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OfferFormValues>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      price_total: editOffer
        ? Math.round(kopecksToRub(editOffer.price_minor))
        : request.budgetRub > 0
          ? request.budgetRub * travelerCount
          : undefined,
      price_per_person: editOffer && editOffer.capacity
        ? Math.round(kopecksToRub(editOffer.price_minor) / editOffer.capacity)
        : request.budgetRub > 0
          ? request.budgetRub
          : undefined,
      message: editOffer?.message ?? "",
      valid_until: editOffer?.expires_at ? editOffer.expires_at.slice(0, 10) : getDefaultValidUntil(),
      excursion_date: mskParts(editOffer?.starts_at)?.date ?? (travelerDate || undefined),
      excursion_start_time: mskParts(editOffer?.starts_at)?.time ?? (request.startTime ?? undefined),
      excursion_end_time: mskParts(editOffer?.ends_at)?.time ?? (request.endTime ?? undefined),
      headcount: editOffer?.capacity ?? travelerCount,
    },
  });

  const headcountVal = useWatch({ control, name: "headcount" });
  const count = headcountVal && headcountVal > 0 ? headcountVal : travelerCount;
  const excursionDate = useWatch({ control, name: "excursion_date" });
  const startTimeVal = useWatch({ control, name: "excursion_start_time" });
  const endTimeVal = useWatch({ control, name: "excursion_end_time" });

  const dateShifted = (excursionDate ?? "") !== travelerDate;
  const timeShifted =
    ((startTimeVal ?? "") !== (request.startTime ?? "") || (endTimeVal ?? "") !== (request.endTime ?? ""));

  const budgetCeilingPerPerson = request.budgetRub > 0 ? request.budgetRub : undefined;
  const hasCatalog = guideTemplates.length > 0;
  const hasRouteBuilder = guidePhotos.length > 0;
  const showCatalogRouteTabs = hasCatalog && hasRouteBuilder;
  const showCatalogPicker = hasCatalog && (!showCatalogRouteTabs || activeCatalogRouteTab === "catalog");
  const showRouteBuilder = hasRouteBuilder && (!showCatalogRouteTabs || activeCatalogRouteTab === "route");

  // Two-sided price calculator: editing one field recomputes the other by current count.
  const handleGroupChange = React.useCallback(
    (raw: string) => {
      const v = Number(raw);
      if (!Number.isNaN(v) && count > 0) {
        setValue("price_per_person", Math.round(v / count), { shouldValidate: false });
      }
    },
    [count, setValue],
  );
  const handlePerPersonChange = React.useCallback(
    (raw: string) => {
      const v = Number(raw);
      if (!Number.isNaN(v) && count > 0) {
        setValue("price_total", v * count, { shouldValidate: true });
      }
    },
    [count, setValue],
  );

  // When headcount changes, hold per-person fixed and recompute the group total.
  const perPersonVal = useWatch({ control, name: "price_per_person" });
  const totalVal = useWatch({ control, name: "price_total" });
  React.useEffect(() => {
    if (perPersonVal != null && !Number.isNaN(perPersonVal) && count > 0) {
      const nextTotal = perPersonVal * count;
      if (totalVal !== nextTotal) {
        setValue("price_total", nextTotal, { shouldValidate: true });
      }
    }
  }, [count, perPersonVal, setValue, totalVal]);

  const onSubmit = React.useCallback(
    async (values: OfferFormValues) => {
      if (submitted || submitInFlight.current) return;
      submitInFlight.current = true;
      try {
        setServerError(null);
        if (guideVerificationStatus !== "approved") {
          setServerError("Предложения доступны только после одобрения профиля гида.");
          return;
        }
        const fd = new FormData();
        fd.set("price_total", String(values.price_total));
        fd.set("message", values.message);
        fd.set("valid_until", values.valid_until);
        if (values.headcount && values.headcount > 0) {
          fd.set("capacity", String(values.headcount));
        }

        fd.set(
          "route_stops",
          JSON.stringify(
            routeStops.map((s, i) => ({
              photoId: s.photoId,
              locationName: s.locationName,
              photoUrl: s.photoUrl,
              sortOrder: i,
            })),
          ),
        );

        const date = values.excursion_date;
        const startTime = values.excursion_start_time;
        const endTime = values.excursion_end_time;
        if (date && startTime) {
          const startsAt = new Date(`${date}T${startTime}:00+03:00`);
          fd.set("starts_at", startsAt.toISOString());
          if (endTime) {
            const endsAt = new Date(`${date}T${endTime}:00+03:00`);
            fd.set("ends_at", endsAt.toISOString());
            const durMin = Math.max(0, Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000));
            fd.set("route_duration_minutes", durMin > 0 ? String(durMin) : "");
          }
        }

        const result: SubmitOfferResult = isEdit && editOffer
          ? await editOfferAction(editOffer.id, requestId, fd)
          : await submitOfferAction(requestId, fd);
        if ("ok" in result && result.ok === true) {
          setSubmitted(true);
          onSuccess?.();
        } else if ("error" in result && result.error) {
          setServerError(result.error);
        }
      } finally {
        submitInFlight.current = false;
      }
    },
    [requestId, onSuccess, routeStops, submitted, guideVerificationStatus, isEdit, editOffer],
  );

  return (
    <>
      <div
        className="fixed inset-0 z-[110] bg-foreground/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Отправить предложение"
        className="fixed bottom-0 right-0 z-[120] flex h-full w-full max-w-[480px] flex-col overflow-y-auto bg-surface shadow-xl max-md:max-w-full max-md:h-[90dvh] max-md:rounded-t-2xl md:top-0 md:bottom-auto"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div>
            <h2 className="font-sans text-base font-semibold text-foreground">
              {isEdit ? "Редактировать предложение" : "Сделать предложение"}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {request.destination} · {request.dateLabel} · {travelerCount} чел.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть панель"
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Request context (readonly) */}
        <div className="border-b border-border/60 bg-muted/30 px-6 py-4 space-y-3">
          {request.interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {request.interests.map((interest) => (
                <span key={interest} className="text-xs bg-muted rounded px-2 py-0.5 text-muted-foreground">
                  {INTEREST_LABEL_BY_ID[interest] ?? interest}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 px-6 py-6" noValidate>
          {hasCatalog || hasRouteBuilder ? (
            <div className="grid gap-3">
              {showCatalogRouteTabs ? (
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
                  <button
                    type="button"
                    disabled={submitted}
                    onClick={() => setActiveCatalogRouteTab("catalog")}
                    className={
                      activeCatalogRouteTab === "catalog"
                        ? "min-h-10 rounded-lg bg-surface px-3 text-sm font-medium text-foreground shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                        : "min-h-10 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    }
                  >
                    Мой каталог
                  </button>
                  <button
                    type="button"
                    disabled={submitted}
                    onClick={() => setActiveCatalogRouteTab("route")}
                    className={
                      activeCatalogRouteTab === "route"
                        ? "min-h-10 rounded-lg bg-surface px-3 text-sm font-medium text-foreground shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                        : "min-h-10 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    }
                  >
                    Построить путь
                  </button>
                </div>
              ) : null}

              {showCatalogPicker ? (
                <div className="grid gap-2">
                  {selectedExcursion ? (
                    <div className="rounded-xl border border-success/30 bg-success/10 px-3.5 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {selectedExcursion.title}
                          </p>
                          {selectedExcursion.duration_text ? (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {selectedExcursion.duration_text}
                            </p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          disabled={submitted}
                          onClick={() => {
                            setSelectedExcursion(null);
                            setExcursionPickerOpen(true);
                          }}
                          className="shrink-0 text-xs font-medium text-primary transition-colors hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          × изменить
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={submitted}
                      onClick={() => setExcursionPickerOpen((prev) => !prev)}
                      className="inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-xl border border-border bg-surface-high px-3.5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Выбрать из моих экскурсий ↓
                    </button>
                  )}
                  {excursionPickerOpen ? (
                    <div className="grid gap-2 rounded-xl border border-border bg-surface-high p-2">
                      {guideTemplates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          disabled={submitted}
                          onClick={() => {
                            setSelectedExcursion(template);
                            setExcursionPickerOpen(false);
                          }}
                          className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span className="min-w-0 truncate text-sm font-medium text-foreground">
                            {template.title}
                          </span>
                          {template.duration_text ? (
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {template.duration_text}
                            </span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {showRouteBuilder ? (
                <div className="grid gap-3">
                  {routeStops.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {routeStops.map((stop, idx) => (
                        <div key={stop.photoId} className="flex items-center gap-3 rounded-xl border border-border bg-surface-high p-2">
                          <Image src={stop.photoUrl} alt={stop.locationName} width={40} height={40} className="size-10 rounded-lg object-cover" />
                          <span className="flex-1 text-sm">{stop.locationName}</span>
                          <button type="button" disabled={submitted} onClick={() => setRouteStops((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-muted-foreground hover:text-destructive text-xs">✕</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Создайте персонализированный маршрут из фото-локаций
                    </p>
                  )}
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {guidePhotos
                      .filter((p) => !routeStops.some((s) => s.photoId === p.id))
                      .map((photo) => (
                        <button
                          key={photo.id}
                          type="button"
                          disabled={submitted}
                          onClick={() => setRouteStops((prev) => [...prev, { photoId: photo.id, locationName: photo.location_name, photoUrl: photo.photoUrl, sortOrder: prev.length }])}
                          className="relative flex-shrink-0 overflow-hidden rounded-xl"
                        >
                          <Image src={photo.photoUrl} alt={photo.location_name} width={64} height={64} className="size-16 object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-foreground/50 px-1 py-0.5">
                            <p className="truncate text-xs text-primary-foreground">{photo.location_name}</p>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Когда: date */}
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              {dateShifted ? <ProposedBadge /> : null}
              <span
                className={
                  request.dateFlexibility === "few_days"
                    ? "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700"
                    : "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-rose-100 text-rose-700"
                }
              >
                {request.dateFlexibility === "few_days" ? "Гибкие даты" : "Точная дата"}
              </span>
            </div>
            <div className="relative">
              <input
                type="date"
                aria-label="Дата"
                className={`${FIELD_CLASS} pr-10`}
                disabled={submitted || dateLocked}
                {...register("excursion_date")}
              />
              {dateLocked ? (
                <Lock
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
              ) : null}
            </div>
          </div>

          {/* Когда: time start → end */}
          <div className="grid gap-2">
            {timeShifted ? (
              <div className="flex items-center gap-2">
                <ProposedBadge />
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <div className="grid flex-1 gap-2">
                <label className="text-sm font-medium text-foreground">Начало</label>
                <div className="relative">
                  <input
                    type="time"
                    aria-label="Время начала"
                    className={`${FIELD_CLASS} pr-10`}
                    disabled={submitted || timeLocked}
                    {...register("excursion_start_time")}
                  />
                  {timeLocked ? (
                    <Lock
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                  ) : null}
                </div>
              </div>
              <div className="grid flex-1 gap-2">
                <label className="text-sm font-medium text-foreground">Конец</label>
                <div className="relative">
                  <input
                    type="time"
                    aria-label="Время окончания"
                    className={`${FIELD_CLASS} pr-10`}
                    disabled={submitted || timeLocked}
                    {...register("excursion_end_time")}
                  />
                  {timeLocked ? (
                    <Lock
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Количество человек */}
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <span
                className={
                  request.mode === "assembly"
                    ? "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-sky-100 text-sky-700"
                    : "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700"
                }
              >
                {request.mode === "assembly" ? "Сборная группа" : "Своя группа"}
              </span>
              <span className="text-sm font-medium text-foreground">
                {request.mode === "assembly" ? "Сколько человек готовы взять?" : "Группа сформирована"}
              </span>
            </div>
            {request.mode === "assembly" ? (
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={50}
                className={FIELD_CLASS}
                disabled={submitted}
                {...register("headcount", { valueAsNumber: true })}
              />
            ) : null}
          </div>

          {/* Цена — двусторонний калькулятор */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Цена</label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1000}
                  max={budgetCeilingPerPerson ? budgetCeilingPerPerson * count : undefined}
                  placeholder="За группу, ₽"
                  className={FIELD_CLASS}
                  aria-invalid={Boolean(errors.price_total)}
                  disabled={submitted}
                  {...register("price_total", {
                    valueAsNumber: true,
                    onChange: (e) => handleGroupChange(e.target.value),
                  })}
                />
                <p className="mt-1 text-xs text-muted-foreground">За группу, ₽</p>
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={budgetCeilingPerPerson ? budgetCeilingPerPerson : undefined}
                  placeholder="На человека, ₽"
                  className={FIELD_CLASS}
                  disabled={submitted}
                  {...register("price_per_person", {
                    valueAsNumber: true,
                    onChange: (e) => handlePerPersonChange(e.target.value),
                  })}
                />
                <p className="mt-1 text-xs text-muted-foreground">На человека, ₽</p>
              </div>
            </div>
            {errors.price_total ? (
              <p className="text-xs text-destructive">{errors.price_total.message}</p>
            ) : null}
          </div>

          {/* Сообщение */}
          <div className="grid gap-2">
            <textarea
              id="panel-message"
              className="min-h-[7rem] w-full resize-y rounded-xl border border-border bg-surface-high px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              placeholder="Дополнительная информация об экскурсии, вопросы и условия"
              aria-invalid={Boolean(errors.message)}
              disabled={submitted}
              {...register("message")}
            />
            {errors.message ? <p className="text-xs text-destructive">{errors.message.message}</p> : null}
          </div>

          {/* Действительно до */}
          <div className="grid gap-2">
            <label htmlFor="panel-valid_until" className="text-sm font-medium text-foreground">
              Действительно до
            </label>
            <input
              id="panel-valid_until"
              type="date"
              className={FIELD_CLASS}
              aria-invalid={Boolean(errors.valid_until)}
              disabled={submitted}
              {...register("valid_until")}
            />
            {errors.valid_until ? <p className="text-xs text-destructive">{errors.valid_until.message}</p> : null}
          </div>

          {serverError ? (
            <p className="text-sm font-semibold text-destructive" role="alert">
              {serverError}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={isSubmitting || submitted}
            className={submitted ? "border border-success/30 bg-success/10 text-success w-full" : "w-full"}
          >
            {submitted
              ? isEdit
                ? "Сохранено"
                : "Отправлено"
              : isSubmitting
                ? isEdit
                  ? "Сохраняем…"
                  : "Отправляем…"
                : isEdit
                  ? "Сохранить изменения"
                  : "Отправить предложение"}
          </Button>
        </form>
      </div>
    </>
  );
}
