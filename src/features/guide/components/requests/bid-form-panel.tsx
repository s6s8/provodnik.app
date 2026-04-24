"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { RequestRecord } from "@/data/supabase/queries";
import { submitOfferAction } from "@/app/(protected)/guide/inbox/[requestId]/offer/actions";
import { formatDurationMinutes } from "@/lib/dates";
import { listGuideLocationPhotos } from "@/data/guide-assets/supabase-client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Uuid } from "@/lib/supabase/types";

type RouteStop = { photoId: string; locationName: string; photoUrl: string; sortOrder: number };

const INTEREST_LABELS: Record<string, string> = {
  history: "История",
  architecture: "Архитектура",
  nature: "Природа",
  food: "Гастрономия",
  art: "Искусство",
  active: "Активный отдых",
  adventure: "Активный отдых",
  religion: "Религия",
  kids: "Для детей",
  unusual: "Необычное",
  nightlife: "Ночная жизнь",
};

const offerFormSchema = z.object({
  price_total: z
    .number()
    .int("Используйте целое число.")
    .min(1_000, "Цена должна быть не менее 1 000 ₽.")
    .max(10_000_000, "Цена слишком высокая."),
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
  route_duration_hours: z.number().int().min(0).max(12),
  route_duration_minutes: z.number().int().min(0).max(45),
  excursion_date: z.string().optional(),
  excursion_start_time: z.string().optional(),
});

type OfferFormValues = z.infer<typeof offerFormSchema>;

function formatRub(amount: number | undefined): string {
  if (!amount || Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getDefaultValidUntil(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

interface BidFormPanelProps {
  requestId: string;
  request: RequestRecord;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BidFormPanel({
  requestId,
  request,
  onClose,
  onSuccess,
}: BidFormPanelProps) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);
  const [guidePhotos, setGuidePhotos] = React.useState<Array<{ id: string; location_name: string; photoUrl: string }>>([]);
  const [routeStops, setRouteStops] = React.useState<RouteStop[]>([]);
  React.useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const photos = await listGuideLocationPhotos(user.id as Uuid);
      const supabaseClient = createSupabaseBrowserClient();
      setGuidePhotos(photos.map(p => ({
        id: p.id,
        location_name: p.location_name,
        photoUrl: supabaseClient.storage.from("guide-media").getPublicUrl(p.object_path).data.publicUrl,
      })));
    }
    void load();
  }, []);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OfferFormValues>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      price_total:
        request.budgetRub > 0 ? request.budgetRub * request.groupSize : undefined,
      message: "",
      valid_until: getDefaultValidUntil(),
      route_duration_hours: 0,
      route_duration_minutes: 0,
      excursion_date: undefined,
      excursion_start_time: undefined,
    },
  });

  const priceTotal = useWatch({ control, name: "price_total" });
  const pricePerPerson =
    priceTotal && request.groupSize > 0
      ? Math.round(priceTotal / request.groupSize)
      : null;

  const routeDurationHours = useWatch({ control, name: "route_duration_hours" });
  const routeDurationMinutesVal = useWatch({ control, name: "route_duration_minutes" });
  const excursionDate = useWatch({ control, name: "excursion_date" });
  const excursionStartTime = useWatch({ control, name: "excursion_start_time" });

  const totalMins = (routeDurationHours ?? 0) * 60 + (routeDurationMinutesVal ?? 0);
  const durationLabel = totalMins > 0 ? formatDurationMinutes(totalMins) : "Общая длительность экскурсии";

  const endTimeLabel = React.useMemo(() => {
    if (!excursionDate || !excursionStartTime || totalMins === 0) return null;
    const starts = new Date(`${excursionDate}T${excursionStartTime}:00+03:00`);
    const ends = new Date(starts.getTime() + totalMins * 60_000);
    return ends.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow" });
  }, [excursionDate, excursionStartTime, totalMins]);

  const onSubmit = React.useCallback(
    async (values: OfferFormValues) => {
      setServerError(null);
      const fd = new FormData();
      fd.set("price_total", String(values.price_total));
      fd.set("message", values.message);
      fd.set("valid_until", values.valid_until);

      fd.set("route_stops", JSON.stringify(routeStops.map((s, i) => ({
        photoId: s.photoId,
        locationName: s.locationName,
        photoUrl: s.photoUrl,
        sortOrder: i,
      }))));

      const durationMinutes = (values.route_duration_hours ?? 0) * 60 + (values.route_duration_minutes ?? 0);
      fd.set("route_duration_minutes", durationMinutes > 0 ? String(durationMinutes) : "");

      const date = values.excursion_date;
      const startTime = values.excursion_start_time;
      if (date && startTime) {
        const startsAt = new Date(`${date}T${startTime}:00+03:00`);
        const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
        fd.set("starts_at", startsAt.toISOString());
        fd.set("ends_at", endsAt.toISOString());
      }

      const result = await submitOfferAction(requestId, fd);
      if (result?.error) {
        setServerError(result.error);
      } else {
        setSubmitted(true);
        onSuccess?.();
      }
    },
    [requestId, onSuccess, routeStops],
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Отправить предложение"
        className="fixed bottom-0 right-0 z-50 flex h-full w-full max-w-[480px] flex-col overflow-y-auto bg-surface shadow-xl max-md:max-w-full max-md:h-[90dvh] max-md:rounded-t-2xl md:top-0 md:bottom-auto"
      >
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div>
            <h2 className="font-sans text-[1.0625rem] font-semibold text-foreground">
              Предложить цену
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {request.destination} · {request.dateLabel} · {request.groupSize}{" "}
              чел.
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

        {/* Request context */}
        <div className="border-b border-border/60 bg-muted/30 px-6 py-4 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {request.mode === "assembly" ? (
              <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-500">
                Сборная группа
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                Своя группа
              </span>
            )}
            {request.interests.length > 0 ? (
              <span className="text-xs text-muted-foreground">
                {request.interests.map((s) => INTEREST_LABELS[s] ?? s).join(" · ")}
              </span>
            ) : null}
          </div>
          {request.description ? (
            <p className="whitespace-pre-line text-sm text-muted-foreground">{request.description}</p>
          ) : (
            <p className="text-sm italic text-muted-foreground/60">Описание не указано</p>
          )}
        </div>

        {/* Success state */}
        {submitted ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
              ✓
            </div>
            <h3 className="font-semibold text-foreground">
              Предложение отправлено!
            </h3>
            <p className="text-sm text-muted-foreground">
              Путешественник получил уведомление и скоро ответит.
            </p>
            <Button onClick={onClose}>Закрыть</Button>
          </div>
        ) : (
          /* Form */
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5 px-6 py-6"
            noValidate
          >
            {/* Route builder */}
            {guidePhotos.length > 0 && (
              <div className="grid gap-3">
                <p className="text-sm font-medium text-foreground">Маршрут</p>

                {/* Selected stops */}
                {routeStops.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {routeStops.map((stop, idx) => (
                      <div key={stop.photoId} className="flex items-center gap-3 rounded-xl border border-border bg-surface-high p-2">
                        <img src={stop.photoUrl} alt={stop.locationName} className="size-10 rounded-lg object-cover" />
                        <span className="flex-1 text-sm">{stop.locationName}</span>
                        <button type="button" onClick={() => setRouteStops(prev => prev.filter((_, i) => i !== idx))}
                          className="text-muted-foreground hover:text-destructive text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Photo picker */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {guidePhotos
                    .filter(p => !routeStops.some(s => s.photoId === p.id))
                    .map(photo => (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => setRouteStops(prev => [...prev, { photoId: photo.id, locationName: photo.location_name, photoUrl: photo.photoUrl, sortOrder: prev.length }])}
                        className="relative flex-shrink-0 overflow-hidden rounded-xl"
                      >
                        <img src={photo.photoUrl} alt={photo.location_name} className="size-16 object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-black/50 px-1 py-0.5">
                          <p className="truncate text-[10px] text-white">{photo.location_name}</p>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Total duration */}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Длительность маршрута</label>
              <div className="flex items-center gap-2">
                <select
                  className="min-h-[2.75rem] rounded-xl border border-border bg-surface-high px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  {...register("route_duration_hours", { valueAsNumber: true })}
                >
                  {[0,1,2,3,4,5,6,7,8,9,10,11,12].map(h => (
                    <option key={h} value={h}>{h} ч</option>
                  ))}
                </select>
                <select
                  className="min-h-[2.75rem] rounded-xl border border-border bg-surface-high px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  {...register("route_duration_minutes", { valueAsNumber: true })}
                >
                  {[0,5,10,15,20,30,45].map(m => (
                    <option key={m} value={m}>{String(m).padStart(2, "0")} мин</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-muted-foreground">{durationLabel}</p>
            </div>

            {/* Date + start time */}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Дата и время начала</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="flex-1 min-h-[2.75rem] rounded-xl border border-border bg-surface-high px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  {...register("excursion_date")}
                />
                <input
                  type="time"
                  className="min-h-[2.75rem] rounded-xl border border-border bg-surface-high px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  {...register("excursion_start_time")}
                />
              </div>
              {endTimeLabel && (
                <p className="text-xs text-muted-foreground">
                  Конец экскурсии: {endTimeLabel}
                </p>
              )}
            </div>

            {/* Price total */}
            <div className="grid gap-2">
              <label
                htmlFor="panel-price_total"
                className="text-sm font-medium text-foreground"
              >
                Итоговая цена, ₽
              </label>
              <input
                id="panel-price_total"
                type="number"
                inputMode="numeric"
                min={1000}
                className="min-h-[2.75rem] w-full rounded-xl border border-border bg-surface-high px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                aria-invalid={Boolean(errors.price_total)}
                {...register("price_total", { valueAsNumber: true })}
              />
              {errors.price_total ? (
                <p className="text-xs text-destructive">
                  {errors.price_total.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {pricePerPerson !== null
                    ? `${formatRub(pricePerPerson)} за человека при ${
                        request.groupSize
                      } чел.`
                    : "Полная сумма за всю группу."}
                </p>
              )}
            </div>

            {/* Message */}
            <div className="grid gap-2">
              <label
                htmlFor="panel-message"
                className="text-sm font-medium text-foreground"
              >
                Сообщение гостю
              </label>
              <textarea
                id="panel-message"
                className="min-h-[7rem] w-full resize-y rounded-xl border border-border bg-surface-high px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                placeholder="Опишите, что входит в цену и почему стоит выбрать вас."
                aria-invalid={Boolean(errors.message)}
                {...register("message")}
              />
              {errors.message ? (
                <p className="text-xs text-destructive">
                  {errors.message.message}
                </p>
              ) : null}
            </div>

            {/* Valid until */}
            <div className="grid gap-2">
              <label
                htmlFor="panel-valid_until"
                className="text-sm font-medium text-foreground"
              >
                Действительно до
              </label>
              <input
                id="panel-valid_until"
                type="date"
                className="min-h-[2.75rem] w-full rounded-xl border border-border bg-surface-high px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                aria-invalid={Boolean(errors.valid_until)}
                {...register("valid_until")}
              />
              {errors.valid_until ? (
                <p className="text-xs text-destructive">
                  {errors.valid_until.message}
                </p>
              ) : null}
            </div>

            {serverError ? (
              <p className="text-sm font-semibold text-destructive" role="alert">
                {serverError}
              </p>
            ) : null}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Отправляем…" : "Отправить предложение"}
            </Button>
          </form>
        )}
      </div>
    </>
  );
}

