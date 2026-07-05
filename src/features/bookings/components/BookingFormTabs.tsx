"use client";

import * as React from "react";
import { Suspense } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { submitRequest } from "@/features/bookings/actions/submitRequest";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ListingRow } from "@/lib/supabase/types";

const QuestionSchema = z.object({
  notes: z.string().min(10, "Минимум 10 символов").max(2000),
});

type QuestionFormValues = z.infer<typeof QuestionSchema>;

function buildOrderSchema(maxGroupSize: number) {
  const cap = Math.max(1, maxGroupSize);
  return z
    .object({
      starts_on: z.string().min(1, "Укажите дату"),
      ends_on: z.string().optional(),
      participants_count: z.number().min(1).max(cap),
      format_preference: z.enum(["group", "private", "combo", "any"]).optional(),
      notes: z.string().max(2000).optional(),
    })
    .superRefine((data, ctx) => {
      const today = todayMoscowISODate();
      if (data.starts_on < today) {
        ctx.addIssue({
          code: "custom",
          message: "Дата не может быть в прошлом",
          path: ["starts_on"],
        });
      }
      const end = data.ends_on?.trim();
      if (end && end < data.starts_on) {
        ctx.addIssue({
          code: "custom",
          message: "Дата окончания не раньше даты начала",
          path: ["ends_on"],
        });
      }
    });
}

type OrderFormValues = z.infer<ReturnType<typeof buildOrderSchema>>;

export interface BookingFormTabsProps {
  listing: Pick<
    ListingRow,
    | "id"
    | "guide_id"
    | "title"
    | "region"
    | "price_from_minor"
    | "currency"
    | "max_group_size"
    | "format"
    | "category"
  > &
    Partial<Pick<ListingRow, "meeting_point" | "duration_minutes">>;
  initialTab?: "order" | "question";
}

function todayMoscowISODate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function userMessageForError(code: string | undefined): string {
  switch (code) {
    case "auth_expired":
      return "Сессия истекла. Войдите снова и повторите.";
    case "listing_unavailable":
      return "Это предложение больше недоступно.";
    case "listing_no_price":
      return "У этой экскурсии ещё не указана цена.";
    case "validation":
      return "Проверьте заполненные поля и попробуйте снова.";
    case "request_create_failed":
      return "Не удалось отправить заявку. Попробуйте через минуту.";
    default:
      return "Не удалось отправить заявку. Попробуйте через минуту.";
  }
}

function isNextRedirectError(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "digest" in value &&
    typeof (value as { digest: unknown }).digest === "string" &&
    String((value as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

function BookingFormTabsInner({ listing, initialTab }: BookingFormTabsProps) {
  const searchParams = useSearchParams();
  const questionRequested =
    searchParams.get("tab") === "question" || initialTab === "question";

  const [actionError, setActionError] = React.useState<string | null>(null);
  const [showQuestion, setShowQuestion] = React.useState(questionRequested);
  const [isPending, startTransition] = React.useTransition();

  const orderSchema = React.useMemo(
    () => buildOrderSchema(listing.max_group_size),
    [listing.max_group_size],
  );

  const orderForm = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      starts_on: "",
      ends_on: "",
      participants_count: 1,
      format_preference: "any",
      notes: "",
    },
    mode: "onTouched",
  });

  const questionForm = useForm<QuestionFormValues>({
    resolver: zodResolver(QuestionSchema),
    defaultValues: { notes: "" },
    mode: "onTouched",
  });

  const startsOnWatch = useWatch({
    control: orderForm.control,
    name: "starts_on",
  });

  const onSubmitOrder = orderForm.handleSubmit((values) => {
    setActionError(null);
    const formatPreference =
      values.format_preference === "any" || !values.format_preference
        ? undefined
        : values.format_preference;
    const ends = values.ends_on?.trim();

    startTransition(() => {
      void submitRequest({
        listingId: listing.id,
        guideId: listing.guide_id,
        destination: listing.title,
        region: listing.region,
        category: listing.category,
        startsOn: values.starts_on,
        endsOn: ends && ends !== "" ? ends : undefined,
        participantsCount: values.participants_count,
        formatPreference,
        notes: values.notes?.trim() ? values.notes.trim() : undefined,
        mode: "order",
      }).catch((err: unknown) => {
        if (isNextRedirectError(err)) {
          throw err;
        }
        const code = err instanceof Error ? err.message : undefined;
        setActionError(userMessageForError(code));
      });
    });
  });

  const onSubmitQuestion = questionForm.handleSubmit((values) => {
    setActionError(null);

    startTransition(() => {
      void submitRequest({
        listingId: listing.id,
        guideId: listing.guide_id,
        destination: listing.title,
        region: listing.region,
        category: listing.category,
        startsOn: todayMoscowISODate(),
        participantsCount: 1,
        notes: values.notes.trim(),
        mode: "question",
      }).catch((err: unknown) => {
        if (isNextRedirectError(err)) {
          throw err;
        }
        const code = err instanceof Error ? err.message : undefined;
        setActionError(userMessageForError(code));
      });
    });
  });

  const todayStr = todayMoscowISODate();

  return (
    <div className="grid gap-6">
      {actionError ? (
        <Alert variant="destructive">
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}

      <form className="grid gap-5" onSubmit={onSubmitOrder} noValidate>
        <div className="grid gap-2">
          <Label htmlFor="booking-starts-on">Дата начала</Label>
          <Input
            id="booking-starts-on"
            type="date"
            min={todayStr}
            aria-invalid={Boolean(orderForm.formState.errors.starts_on)}
            aria-describedby={orderForm.formState.errors.starts_on ? "booking-starts-on-error" : undefined}
            {...orderForm.register("starts_on")}
          />
          {orderForm.formState.errors.starts_on ? (
            <p id="booking-starts-on-error" role="alert" className="text-sm text-destructive">
              {orderForm.formState.errors.starts_on.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="booking-ends-on">Дата окончания (необязательно)</Label>
          <Input
            id="booking-ends-on"
            type="date"
            min={startsOnWatch || todayStr}
            aria-invalid={Boolean(orderForm.formState.errors.ends_on)}
            aria-describedby={orderForm.formState.errors.ends_on ? "booking-ends-on-error" : undefined}
            {...orderForm.register("ends_on")}
          />
          {orderForm.formState.errors.ends_on ? (
            <p id="booking-ends-on-error" role="alert" className="text-sm text-destructive">
              {orderForm.formState.errors.ends_on.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="booking-participants">Число участников</Label>
          <Input
            id="booking-participants"
            type="number"
            min={1}
            max={listing.max_group_size}
            aria-invalid={Boolean(orderForm.formState.errors.participants_count)}
            aria-describedby={orderForm.formState.errors.participants_count ? "booking-participants-error" : undefined}
            {...orderForm.register("participants_count", { valueAsNumber: true })}
          />
          {orderForm.formState.errors.participants_count ? (
            <p id="booking-participants-error" role="alert" className="text-sm text-destructive">
              {orderForm.formState.errors.participants_count.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="booking-format">Формат</Label>
          <Controller
            name="format_preference"
            control={orderForm.control}
            render={({ field }) => (
              <Select
                value={field.value ?? "any"}
                onValueChange={(v) =>
                  field.onChange(v as OrderFormValues["format_preference"])
                }
              >
                <SelectTrigger id="booking-format" className="w-full">
                  <SelectValue placeholder="Любой формат" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Любой формат</SelectItem>
                  <SelectItem value="group">Групповой</SelectItem>
                  <SelectItem value="private">Индивидуальный</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {listing.duration_minutes != null ? (
          <div className="text-sm text-muted-foreground">
            Продолжительность: {listing.duration_minutes} мин.
          </div>
        ) : null}

        {"meeting_point" in listing ? (
          <div className="text-sm text-muted-foreground">
            Место встречи:{" "}
            {listing.meeting_point ? listing.meeting_point : "уточняется"}
          </div>
        ) : null}

        <div className="grid gap-2">
          <Label htmlFor="booking-notes">Пожелания, вопросы, особые потребности</Label>
          <Textarea
            id="booking-notes"
            rows={4}
            aria-invalid={Boolean(orderForm.formState.errors.notes)}
            aria-describedby={orderForm.formState.errors.notes ? "booking-notes-error" : undefined}
            {...orderForm.register("notes")}
          />
          {orderForm.formState.errors.notes ? (
            <p id="booking-notes-error" role="alert" className="text-sm text-destructive">
              {orderForm.formState.errors.notes.message}
            </p>
          ) : null}
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Отправка…" : "Отправить заявку"}
        </Button>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-green-600 shrink-0" />
          Заявка бесплатна · Гид отвечает в течение 24 ч
        </p>
      </form>

      <div className="grid gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="justify-self-start"
          aria-expanded={showQuestion}
          onClick={() => setShowQuestion((prev) => !prev)}
        >
          Задать вопрос
        </Button>

        {showQuestion ? (
          <form className="grid gap-3" onSubmit={onSubmitQuestion} noValidate>
            <div className="grid gap-2">
              <Label htmlFor="booking-question-notes">Ваш вопрос</Label>
              <Textarea
                id="booking-question-notes"
                rows={5}
                {...questionForm.register("notes")}
              />
              {questionForm.formState.errors.notes ? (
                <p className="text-sm text-destructive">
                  {questionForm.formState.errors.notes.message}
                </p>
              ) : null}
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Отправка…" : "Отправить вопрос"}
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

export function BookingFormTabs(props: BookingFormTabsProps) {
  return (
    <Suspense
      fallback={<p className="text-sm text-muted-foreground">Загрузка формы…</p>}
    >
      <BookingFormTabsInner {...props} />
    </Suspense>
  );
}
