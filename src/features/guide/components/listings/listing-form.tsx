"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { listingInputSchema, type ListingInput } from "@/lib/supabase/listing-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ListingFormProps = {
  defaultValues?: Partial<ListingInput>;
  onSubmit: (data: ListingInput) => Promise<string>;
  submitLabel?: string;
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs font-medium text-destructive">
      {message}
    </p>
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

export function ListingForm({
  defaultValues,
  onSubmit,
  submitLabel = "Сохранить",
}: ListingFormProps) {
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ListingInput>({
    resolver: zodResolver(listingInputSchema),
    defaultValues: {
      title: "",
      description: "",
      destination: "",
      price_per_person: 0,
      max_group_size: 6,
      duration_days: 1,
      included: "",
      excluded: "",
      ...defaultValues,
    },
  });

  const submit = React.useCallback(
    async (data: ListingInput) => {
      setServerError(null);
      try {
        await onSubmit(data);
      } catch (err) {
        setServerError(
          err instanceof Error ? err.message : "Произошла ошибка. Попробуйте ещё раз.",
        );
      }
    },
    [onSubmit],
  );

  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-5" noValidate>
      {serverError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {serverError}
        </div>
      ) : null}

      <div className="grid gap-2">
        <FieldLabel htmlFor="title">Название тура</FieldLabel>
        <Input
          id="title"
          placeholder="Например, Байкальский поход на 3 дня"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "title-error" : undefined}
          {...register("title")}
        />
        <FieldError id="title-error" message={errors.title?.message} />
      </div>

      <div className="grid gap-2">
        <FieldLabel htmlFor="destination">Направление</FieldLabel>
        <Input
          id="destination"
          placeholder="Например, Байкал, Иркутская область"
          aria-invalid={Boolean(errors.destination)}
          aria-describedby={errors.destination ? "destination-error" : undefined}
          {...register("destination")}
        />
        <FieldError id="destination-error" message={errors.destination?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <FieldLabel htmlFor="price_per_person">Цена за человека (₽)</FieldLabel>
          <Input
            id="price_per_person"
            type="number"
            inputMode="numeric"
            min={0}
            aria-invalid={Boolean(errors.price_per_person)}
            aria-describedby={errors.price_per_person ? "price-error" : undefined}
            {...register("price_per_person", { valueAsNumber: true })}
          />
          <FieldError id="price-error" message={errors.price_per_person?.message} />
        </div>
        <div className="grid gap-2">
          <FieldLabel htmlFor="max_group_size">Макс. участников</FieldLabel>
          <Input
            id="max_group_size"
            type="number"
            inputMode="numeric"
            min={1}
            max={50}
            aria-invalid={Boolean(errors.max_group_size)}
            aria-describedby={errors.max_group_size ? "group-error" : undefined}
            {...register("max_group_size", { valueAsNumber: true })}
          />
          <FieldError id="group-error" message={errors.max_group_size?.message} />
        </div>
      </div>

      <div className="grid gap-2">
        <FieldLabel htmlFor="duration_days">Длительность (дней)</FieldLabel>
        <Input
          id="duration_days"
          type="number"
          inputMode="numeric"
          min={1}
          max={365}
          aria-invalid={Boolean(errors.duration_days)}
          aria-describedby={errors.duration_days ? "duration-error" : undefined}
          {...register("duration_days", { valueAsNumber: true })}
        />
        <FieldError id="duration-error" message={errors.duration_days?.message} />
      </div>

      <div className="grid gap-2">
        <FieldLabel htmlFor="description">Описание</FieldLabel>
        <Textarea
          id="description"
          placeholder="Расскажите о маршруте, программе дней, уровне сложности..."
          rows={5}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? "description-error" : undefined}
          {...register("description")}
        />
        <FieldError id="description-error" message={errors.description?.message} />
      </div>

      <div className="grid gap-2">
        <FieldLabel htmlFor="included">Что включено</FieldLabel>
        <Textarea
          id="included"
          placeholder="Например: трансфер, питание, снаряжение"
          rows={3}
          aria-invalid={Boolean(errors.included)}
          aria-describedby={errors.included ? "included-error" : undefined}
          {...register("included")}
        />
        <p className="text-xs text-muted-foreground">
          Перечислите через запятую или по одному пункту на строку.
        </p>
        <FieldError id="included-error" message={errors.included?.message} />
      </div>

      <div className="grid gap-2">
        <FieldLabel htmlFor="excluded">Что не включено</FieldLabel>
        <Textarea
          id="excluded"
          placeholder="Например: авиабилеты, страховка, личные расходы"
          rows={3}
          aria-invalid={Boolean(errors.excluded)}
          aria-describedby={errors.excluded ? "excluded-error" : undefined}
          {...register("excluded")}
        />
        <p className="text-xs text-muted-foreground">
          Перечислите через запятую или по одному пункту на строку.
        </p>
        <FieldError id="excluded-error" message={errors.excluded?.message} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Сохранение..." : submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={isSubmitting}
        >
          Отмена
        </Button>
      </div>
    </form>
  );
}
