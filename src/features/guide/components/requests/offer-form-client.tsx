"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { RequestRecord } from "@/data/supabase/queries";
import { submitOfferAction } from "@/app/(protected)/guide/inbox/[requestId]/offer/actions";

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
      price_total:
        request.budgetRub > 0
          ? request.budgetRub * request.groupSize
          : undefined,
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
    <div className="mx-auto w-full max-w-[640px] px-[clamp(20px,4vw,48px)] py-sec-pad">
      {/* Back link */}
      <Link
        href={`/guide/inbox/${requestId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8"
        aria-label="Вернуться к запросу"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Назад к запросу
      </Link>

      {/* Header */}
      <p className="mb-2 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Кабинет гида
      </p>
      <h1 className="mb-2 font-display text-[clamp(1.875rem,3.5vw,2.375rem)] font-semibold leading-[1.1]">
        Предложить цену
      </h1>
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
      >
        {/* Price total */}
        <div className="mb-5 grid gap-2">
          <label
            htmlFor="price_total"
            className="font-sans text-sm font-medium text-foreground"
          >
            Итоговая цена, ₽
          </label>
          <input
            id="price_total"
            type="number"
            inputMode="numeric"
            min={1000}
            className="min-h-[2.75rem] w-full rounded-[0.75rem] border border-outline-variant/35 bg-surface-high px-3.5 py-2.5 font-sans text-[0.9375rem] text-foreground outline-none transition-[border-color] duration-150 focus:border-primary"
            aria-invalid={Boolean(errors.price_total)}
            aria-describedby={
              errors.price_total ? "price_total-error" : undefined
            }
            {...register("price_total", { valueAsNumber: true })}
          />
          {errors.price_total ? (
            <p
              id="price_total-error"
              className="font-sans text-xs font-semibold text-destructive"
            >
              {errors.price_total.message}
            </p>
          ) : (
            <p className="font-sans text-xs text-muted-foreground">
              Полная сумма за всю группу. Не за человека.
            </p>
          )}
        </div>

        {/* Price per person — display only */}
        <div className="mb-5 grid gap-2">
          <p className="font-sans text-sm font-medium text-foreground">
            Цена на человека
          </p>
          <div
            className="flex items-center gap-2 rounded-[0.75rem] border border-outline-variant/20 bg-surface-low px-3.5 py-2.5 font-sans text-[0.9375rem] font-semibold text-primary"
            aria-live="polite"
            aria-atomic
          >
            {pricePerPerson !== null ? formatRub(pricePerPerson) : "—"}
          </div>
          <p className="font-sans text-xs text-muted-foreground">
            Рассчитывается автоматически: итоговая цена / {request.groupSize}{" "}
            чел.
          </p>
        </div>

        {/* Message */}
        <div className="mb-5 grid gap-2">
          <label
            htmlFor="message"
            className="font-sans text-sm font-medium text-foreground"
          >
            Сообщение гостю
          </label>
          <textarea
            id="message"
            className="min-h-[8rem] w-full resize-y rounded-[0.75rem] border border-outline-variant/35 bg-surface-high px-3.5 py-2.5 font-sans text-[0.9375rem] text-foreground outline-none transition-[border-color] duration-150 focus:border-primary"
            placeholder="Опишите, что входит в цену, условия поездки, и почему стоит выбрать вас."
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? "message-error" : undefined}
            {...register("message")}
          />
          {errors.message ? (
            <p
              id="message-error"
              className="font-sans text-xs font-semibold text-destructive"
            >
              {errors.message.message}
            </p>
          ) : (
            <p className="font-sans text-xs text-muted-foreground">
              Минимум 10 символов. Конкретика убеждает лучше шаблонов.
            </p>
          )}
        </div>

        {/* Valid until */}
        <div className="mb-8 grid gap-2">
          <label
            htmlFor="valid_until"
            className="font-sans text-sm font-medium text-foreground"
          >
            Предложение действительно до
          </label>
          <input
            id="valid_until"
            type="date"
            className="min-h-[2.75rem] w-full rounded-[0.75rem] border border-outline-variant/35 bg-surface-high px-3.5 py-2.5 font-sans text-[0.9375rem] text-foreground outline-none transition-[border-color] duration-150 focus:border-primary"
            aria-invalid={Boolean(errors.valid_until)}
            aria-describedby={
              errors.valid_until ? "valid_until-error" : undefined
            }
            {...register("valid_until")}
          />
          {errors.valid_until ? (
            <p
              id="valid_until-error"
              className="font-sans text-xs font-semibold text-destructive"
            >
              {errors.valid_until.message}
            </p>
          ) : (
            <p className="font-sans text-xs text-muted-foreground">
              По умолчанию: сегодня + 7 дней.
            </p>
          )}
        </div>

        {/* Server-level error */}
        {serverError ? (
          <p
            className="mb-5 font-sans text-xs font-semibold text-destructive"
            role="alert"
          >
            {serverError}
          </p>
        ) : null}

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full"
          aria-busy={isSubmitting}
        >
          {isSubmitting ? "Отправляем…" : "Отправить предложение"}
        </Button>
      </form>
    </div>
  );
}
