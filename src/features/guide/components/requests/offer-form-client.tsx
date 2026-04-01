"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";

import type { RequestRecord } from "@/data/supabase/queries";
import { submitOfferAction } from "@/app/(protected)/guide/requests/[requestId]/offer/actions";

// ---------------------------------------------------------------------------
// Local Zod schema for the client form (mirrors server schema)
// ---------------------------------------------------------------------------

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
});

type OfferFormValues = z.infer<typeof offerFormSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRub(amount: number | undefined): string {
  if (!amount || Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type OfferFormClientProps = {
  requestId: string;
  request: RequestRecord;
  validUntilDefault: string;
};

export function OfferFormClient({
  requestId,
  request,
  validUntilDefault,
}: OfferFormClientProps) {
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OfferFormValues>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      price_total: request.budgetRub > 0 ? request.budgetRub * request.groupSize : undefined,
      message: "",
      valid_until: validUntilDefault,
    },
  });

  const priceTotal = useWatch({ control, name: "price_total" });

  const pricePerPerson =
    priceTotal && request.groupSize > 0
      ? Math.round(priceTotal / request.groupSize)
      : null;

  const onSubmit = React.useCallback(
    async (values: OfferFormValues) => {
      setServerError(null);

      const fd = new FormData();
      fd.set("price_total", String(values.price_total));
      fd.set("message", values.message);
      fd.set("valid_until", values.valid_until);

      const result = await submitOfferAction(requestId, fd);
      if (result?.error) {
        setServerError(result.error);
      }
    },
    [requestId],
  );

  return (
    <div className="offer-form-shell">
      {/* Back link */}
      <Link
        href={`/guide/requests/${requestId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8"
        aria-label="Вернуться к запросу"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Назад к запросу
      </Link>

      {/* Header */}
      <p className="sec-label">Кабинет гида</p>
      <h1 className="sec-title mb-2">Предложить цену</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Запрос:{" "}
        <strong className="font-semibold text-foreground">
          {request.destination}
        </strong>
        {" · "}
        {request.dateLabel}
        {" · "}
        {request.groupSize} чел.
      </p>

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        aria-label="Форма предложения гида"
        noValidate
        className="offer-form-grid"
      >
        {/* Price total */}
        <div className="offer-form-field mb-5">
          <label htmlFor="price_total" className="offer-form-label">
            Итоговая цена, ₽
          </label>
          <input
            id="price_total"
            type="number"
            inputMode="numeric"
            min={1000}
            className="offer-form-input"
            aria-invalid={Boolean(errors.price_total)}
            aria-describedby={errors.price_total ? "price_total-error" : undefined}
            {...register("price_total", { valueAsNumber: true })}
          />
          {errors.price_total ? (
            <p id="price_total-error" className="offer-form-error">
              {errors.price_total.message}
            </p>
          ) : (
            <p className="offer-form-hint">
              Полная сумма за всю группу. Не за человека.
            </p>
          )}
        </div>

        {/* Price per person — display only */}
        <div className="offer-form-field mb-5">
          <p className="offer-form-label">Цена на человека</p>
          <div className="offer-form-derived" aria-live="polite" aria-atomic>
            {pricePerPerson !== null ? formatRub(pricePerPerson) : "—"}
          </div>
          <p className="offer-form-hint">
            Рассчитывается автоматически: итоговая цена / {request.groupSize} чел.
          </p>
        </div>

        {/* Message */}
        <div className="offer-form-field mb-5">
          <label htmlFor="message" className="offer-form-label">
            Сообщение гостю
          </label>
          <textarea
            id="message"
            className="offer-form-textarea"
            placeholder="Опишите, что входит в цену, условия поездки, и почему стоит выбрать вас."
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? "message-error" : undefined}
            {...register("message")}
          />
          {errors.message ? (
            <p id="message-error" className="offer-form-error">
              {errors.message.message}
            </p>
          ) : (
            <p className="offer-form-hint">
              Минимум 10 символов. Конкретика убеждает лучше шаблонов.
            </p>
          )}
        </div>

        {/* Valid until */}
        <div className="offer-form-field mb-8">
          <label htmlFor="valid_until" className="offer-form-label">
            Предложение действительно до
          </label>
          <input
            id="valid_until"
            type="date"
            className="offer-form-input"
            aria-invalid={Boolean(errors.valid_until)}
            aria-describedby={errors.valid_until ? "valid_until-error" : undefined}
            {...register("valid_until")}
          />
          {errors.valid_until ? (
            <p id="valid_until-error" className="offer-form-error">
              {errors.valid_until.message}
            </p>
          ) : (
            <p className="offer-form-hint">По умолчанию: сегодня + 7 дней.</p>
          )}
        </div>

        {/* Server-level error */}
        {serverError ? (
          <p className="offer-form-error mb-5" role="alert">
            {serverError}
          </p>
        ) : null}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="offer-form-submit"
          aria-busy={isSubmitting}
        >
          {isSubmitting ? "Отправляем…" : "Отправить предложение"}
        </button>
      </form>
    </div>
  );
}
