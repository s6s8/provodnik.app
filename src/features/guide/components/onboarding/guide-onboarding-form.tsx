"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ensureGuideDocumentReservations } from "@/data/guide-assets/supabase-client";
import type { AuthContext } from "@/lib/auth/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  GuideProfileUpsert,
  GuideVerificationStatusDb,
} from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import {
  guideExperienceLevels,
  guideGovIdTypes,
  guideOnboardingSchema,
  type GuideOnboardingValues,
} from "@/features/guide/utils/guide-onboarding-schema";

function splitCommaList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function formatExperienceLevel(
  value: (typeof guideExperienceLevels)[number]
) {
  return value === "starter"
    ? "Начинающий"
    : value === "intermediate"
      ? "Опытный"
      : "Эксперт";
}

function formatGovIdType(value: (typeof guideGovIdTypes)[number]) {
  return value === "passport"
    ? "Загранпаспорт"
    : value === "national_id"
      ? "Внутренний паспорт / ID-карта"
      : "Водительское удостоверение";
}

function getBackendFailureMessage(error: { code?: string; message?: string } | null) {
  if (error?.code === "42501") {
    return "Не удалось сохранить анкету из-за ограничений доступа. Данные остались в форме, попробуйте снова после повторного входа.";
  }
  const message = error?.message?.toLowerCase() ?? "";
  if (message.includes("fetch") || message.includes("network")) {
    return "Не удалось связаться с сервером. Проверьте соединение и повторите попытку, данные в форме сохранены.";
  }
  return "Не удалось сохранить анкету в профиле. Проверьте доступ к аккаунту и повторите попытку, данные в форме сохранены.";
}

const selectClassName = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

const verificationFields = [
  ["legalName", "Юридическое имя", "Как в паспорте или ID-карте", "name"],
  ["citizenshipCountry", "Страна гражданства", "Россия", "country"],
  ["govIdLast4", "Последние 4 цифры документа", "1234", "off"],
  ["addressLine1", "Адрес", "Улица и дом", "street-address"],
  ["addressCity", "Город", "Город", "address-level2"],
  ["addressCountry", "Страна", "Страна", "country"],
  ["emergencyContactName", "Имя контакта на случай ЧС", "Полное имя", "off"],
  ["emergencyContactPhone", "Телефон контакта на случай ЧС", "+7 999 000-00-00", "tel"],
] as const;

const referenceFields = [
  ["referenceName1", "Имя рекомендателя 1"],
  ["referenceContact1", "Контакты рекомендателя 1"],
  ["referenceName2", "Имя рекомендателя 2"],
  ["referenceContact2", "Контакты рекомендателя 2"],
] as const;

type GuideOnboardingFormProps = { auth: AuthContext };

export function GuideOnboardingForm({ auth }: GuideOnboardingFormProps) {
  const [submitted, setSubmitted] = React.useState<GuideOnboardingValues | null>(null);
  const [persistedToBackend, setPersistedToBackend] = React.useState(false);
  const [backendError, setBackendError] = React.useState<string | null>(null);
  const [documentReservations, setDocumentReservations] = React.useState<
    Array<{ documentType: string; objectPath: string; status: GuideVerificationStatusDb }>
  >([]);

  const canPersistToSupabase =
    auth.hasSupabaseEnv && auth.isAuthenticated && auth.source === "supabase";

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<GuideOnboardingValues>({
    resolver: zodResolver(guideOnboardingSchema),
    defaultValues: {
      displayName: "",
      tagline: "",
      bio: "",
      regions: [],
      languages: [],
      specialties: [],
      isAvailable: true,
      experienceLevel: "starter",
      yearsExperience: 0,
      currentBaseCity: "",
      groupSizeMax: 6,
      hasFirstAidTraining: false,
      acceptsPrivateTours: true,
      acceptsGroupTours: false,
      legalName: "",
      birthDate: "",
      citizenshipCountry: "",
      govIdType: "passport",
      govIdLast4: "",
      addressLine1: "",
      addressCity: "",
      addressCountry: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      referenceName1: "",
      referenceContact1: "",
      referenceName2: "",
      referenceContact2: "",
      consentBackgroundCheck: false,
      attestTruthful: false,
    },
    mode: "onTouched",
  });

  const regions = useWatch({ control, name: "regions" }) ?? [];
  const languages = useWatch({ control, name: "languages" }) ?? [];
  const specialties = useWatch({ control, name: "specialties" }) ?? [];

  const onSubmit = React.useCallback(async (values: GuideOnboardingValues) => {
    setBackendError(null);
    setDocumentReservations([]);
    setPersistedToBackend(false);

    if (!canPersistToSupabase) {
      setSubmitted(values);
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!user || userError) {
        setBackendError("Сессия больше недействительна. Войдите снова и повторите сохранение, данные в форме не потеряны.");
        return;
      }

      const verificationStatus: GuideVerificationStatusDb =
        values.consentBackgroundCheck && values.attestTruthful ? "submitted" : "draft";
      const primarySpecialization = values.specialties[0] ?? null;
      const baseCityTrimmed = values.currentBaseCity?.trim();
      const groupSizeMaxNum = Number(values.groupSizeMax);
      const payload: GuideProfileUpsert = {
        user_id: user.id,
        display_name: values.displayName,
        bio: values.bio,
        years_experience: values.yearsExperience,
        specialization: primarySpecialization,
        regions: values.regions,
        languages: values.languages,
        specialties: values.specialties,
        is_available: values.isAvailable,
        verification_status: verificationStatus,
        verification_notes: [
          `Базовый город: ${values.currentBaseCity}`,
          `Основная специализация: ${primarySpecialization ?? "-"}`,
          `Готов принимать новые заявки: ${values.isAvailable ? "да" : "нет"}`,
          `Частные туры: ${values.acceptsPrivateTours ? "да" : "нет"}`,
          `Групповые туры: ${values.acceptsGroupTours ? "да" : "нет"}`,
        ].join(" | "),
        base_city: baseCityTrimmed && baseCityTrimmed.length > 0 ? baseCityTrimmed : null,
        max_group_size: !isNaN(groupSizeMaxNum) && groupSizeMaxNum > 0 ? Math.floor(groupSizeMaxNum) : null,
      };

      const { error: upsertError } = await supabase
        .from("guide_profiles")
        .upsert(payload, { onConflict: "user_id" });

      if (upsertError) {
        setBackendError(getBackendFailureMessage(upsertError));
        return;
      }

      const reservations = await ensureGuideDocumentReservations(user.id, verificationStatus);
      setDocumentReservations(
        reservations.map((item) => ({
          documentType: item.documentType,
          objectPath: item.objectPath,
          status: item.status,
        }))
      );
      setPersistedToBackend(true);
      window.location.assign("/guide/dashboard");
    } catch (error) {
      const normalizedError =
        error instanceof Error ? { message: error.message } : { message: "unknown" };
      setBackendError(getBackendFailureMessage(normalizedError));
    }
  }, [canPersistToSupabase]);

  const handleStartOver = React.useCallback(() => {
    setSubmitted(null);
    setPersistedToBackend(false);
    setBackendError(null);
    setDocumentReservations([]);
    reset();
  }, [reset]);

  if (submitted) {
    return (
      <div className="space-y-4">
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="flex flex-row items-start gap-4 space-y-0">
            <div className="mt-0.5 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CheckCircle2 className="size-5" />
            </div>
            <div className="space-y-1">
              <CardTitle>{persistedToBackend ? "Профиль сохранён" : "Анкета сохранена локально"}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {persistedToBackend
                  ? "Анкета обновлена в Supabase."
                  : "В демо-режиме данные остаются только в этом браузере."}
              </p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            <SummaryRow label="Имя" value={submitted.displayName} />
            <SummaryRow label="О себе" value={submitted.bio} />
            <SummaryRow label="Регионы" value={submitted.regions.join(", ")} />
            <SummaryRow label="Языки" value={submitted.languages.join(", ")} />
            <SummaryRow label="Специализации" value={submitted.specialties.join(", ")} />
            <SummaryRow
              label="Доступность"
              value={submitted.isAvailable ? "Принимаю новые заявки" : "Временно недоступен(на)"}
            />
            {documentReservations.map((item) => (
              <SummaryRow
                key={item.documentType}
                label={`${item.documentType} (${item.status})`}
                value={item.objectPath}
              />
            ))}
          </CardContent>
        </Card>
        <Button type="button" onClick={handleStartOver}>
          Заполнить заново
          <RotateCcw className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <form className="grid gap-6" onSubmit={handleSubmit(onSubmit)}>
      <SectionHeader badge="Профиль" title="Публичный профиль" description="Поля, которые попадут в guide_profiles и публичную карточку." />
      <TextField id="displayName" label="Имя в профиле" placeholder="Амина К." error={errors.displayName?.message} register={register("displayName")} />
      <TextField id="tagline" label="Слоган" placeholder="Спокойные прогулки и скрытые кафе" error={errors.tagline?.message} register={register("tagline")} />
      <TextAreaField id="bio" label="О себе" placeholder="Опишите, как вы ведёте туры и что показываете." error={errors.bio?.message} register={register("bio")} />
      <CommaField id="regions" label="Регионы" value={regions} error={errors.regions?.message} onChange={(value) => setValue("regions", splitCommaList(value), { shouldTouch: true, shouldValidate: true })} />
      <CommaField id="languages" label="Языки" value={languages} error={errors.languages?.message} onChange={(value) => setValue("languages", splitCommaList(value), { shouldTouch: true, shouldValidate: true })} />
      <CommaField id="specialties" label="Специализации" value={specialties} error={errors.specialties?.message} onChange={(value) => setValue("specialties", splitCommaList(value), { shouldTouch: true, shouldValidate: true })} hint="Первая специализация станет основным направлением профиля." />

      <Separator className="my-1" />
      <SectionHeader badge="Операции" title="Как вы ведёте туры" description="Опыт, размер групп и доступность для новых заявок." />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <FieldLabel htmlFor="experienceLevel">Уровень опыта</FieldLabel>
          <select id="experienceLevel" className={selectClassName} {...register("experienceLevel")}>
            {guideExperienceLevels.map((level) => (
              <option key={level} value={level}>{formatExperienceLevel(level)}</option>
            ))}
          </select>
        </div>
        <TextField id="yearsExperience" label="Лет опыта" placeholder="0" type="number" error={errors.yearsExperience?.message} register={register("yearsExperience", { valueAsNumber: true })} />
        <TextField id="currentBaseCity" label="Базовый город" placeholder="Санкт-Петербург" error={errors.currentBaseCity?.message} register={register("currentBaseCity")} />
        <div className="grid gap-2">
          <FieldLabel htmlFor="groupSizeMax" className="flex items-center gap-1">
            Вместимость группы
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="inline-flex items-center justify-center rounded-full w-4 h-4 text-xs bg-muted text-muted-foreground hover:bg-muted/80">?</button>
              </PopoverTrigger>
              <PopoverContent className="text-sm max-w-xs">
                Запросы с группой больше этого числа вам приходить не будут
              </PopoverContent>
            </Popover>
          </FieldLabel>
          <Input id="groupSizeMax" type="number" placeholder="6" aria-invalid={Boolean(errors.groupSizeMax?.message)} aria-describedby={errors.groupSizeMax?.message ? "groupSizeMax-error" : undefined} {...register("groupSizeMax", { valueAsNumber: true })} />
          <FieldError id="groupSizeMax-error" message={errors.groupSizeMax?.message} />
        </div>
      </div>
      <CheckboxField label="Готов(а) принимать новые заявки" description="Этот статус будет сохранён в профиле и использован на маркетплейсных поверхностях." register={register("isAvailable")} />
      <CheckboxField label="Есть курс первой помощи" description="Покажите гостям, что вы готовы к выездным маршрутам." register={register("hasFirstAidTraining")} />
      <CheckboxField label="Принимаю частные туры" description="Готов(а) работать с одной компанией за раз." register={register("acceptsPrivateTours")} />
      <CheckboxField label="Принимаю групповые туры" description="Готов(а) объединять путешественников в одну группу." register={register("acceptsGroupTours")} />

      <Separator className="my-1" />
      <SectionHeader badge="Проверка" title="Данные для верификации" description="При активной сессии этот блок сохраняется вместе с профилем. В демо-режиме он остаётся локальным." />
      <TextField id="birthDate" label="Дата рождения" type="date" error={errors.birthDate?.message} register={register("birthDate")} />
      <div className="grid gap-4 sm:grid-cols-2">
        {verificationFields.map(([id, label, placeholder, autoComplete]) => (
          <TextField
            key={id}
            id={id}
            label={label}
            placeholder={placeholder}
            autoComplete={autoComplete}
            error={errors[id]?.message}
            register={register(id)}
          />
        ))}
      </div>
      <div className="grid gap-2">
        <FieldLabel htmlFor="govIdType">Тип документа</FieldLabel>
        <select id="govIdType" className={selectClassName} {...register("govIdType")}>
          {guideGovIdTypes.map((type) => (
            <option key={type} value={type}>{formatGovIdType(type)}</option>
          ))}
        </select>
      </div>

      <Separator className="my-1" />
      <SectionHeader badge="Рекомендации" title="Профессиональные рекомендации" description="Два контакта, которые могут подтвердить ваш опыт." />
      <div className="grid gap-4 sm:grid-cols-2">
        {referenceFields.map(([id, label]) => (
          <TextField
            key={id}
            id={id}
            label={label}
            placeholder="Телефон, email или ссылка"
            error={errors[id]?.message}
            register={register(id)}
          />
        ))}
      </div>

      <Separator className="my-1" />
      <SectionHeader badge="Согласия" title="Согласия и подтверждения" description="Эти пункты нужны для рабочего режима проверки." />
      <CheckboxField label="Я согласен(а) на проверку благонадёжности" description="Это обязательное условие перед приёмом платных бронирований." error={errors.consentBackgroundCheck?.message} register={register("consentBackgroundCheck")} />
      <CheckboxField label="Подтверждаю, что данные указаны честно и без искажений" description="Предоставление ложных данных может привести к блокировке профиля." error={errors.attestTruthful?.message} register={register("attestTruthful")} />

      {backendError ? (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-foreground">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p>{backendError}</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {canPersistToSupabase
            ? "Успешное сохранение обновит guide_profiles и переведёт вас на /guide/dashboard."
            : "Без Supabase или активной сессии анкета завершается в локальном режиме."}
        </p>
        <Button type="submit" disabled={isSubmitting}>
          {canPersistToSupabase ? "Сохранить и перейти в кабинет" : "Сохранить анкету локально"}
        </Button>
      </div>
    </form>
  );
}

function SectionHeader({ badge, title, description }: { badge: string; title: string; description: string }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{badge}</Badge>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TextField({ id, label, error, register, ...props }: { id: string; label: string; error?: string; register: ReturnType<typeof useForm<GuideOnboardingValues>>["register"] extends (...args: any[]) => infer R ? R : never } & React.ComponentProps<typeof Input>) {
  return (
    <div className="grid gap-2">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...props} {...register} />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TextAreaField({ id, label, error, register, ...props }: { id: string; label: string; error?: string; register: ReturnType<typeof useForm<GuideOnboardingValues>>["register"] extends (...args: any[]) => infer R ? R : never } & React.ComponentProps<typeof Textarea>) {
  return (
    <div className="grid gap-2">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Textarea id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...props} {...register} />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function CommaField({ id, label, value, error, hint, onChange }: { id: string; label: string; value: string[]; error?: unknown; hint?: string; onChange: (value: string) => void }) {
  return (
    <div className="grid gap-2">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} value={value.join(", ")} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
      {hint ? <FieldHint>{hint}</FieldHint> : null}
      <FieldError id={`${id}-error`} message={typeof error === "string" ? error : undefined} />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CheckboxField({ label, description, error, register }: { label: string; description: string; error?: string; register: ReturnType<typeof useForm<GuideOnboardingValues>>["register"] extends (...args: any[]) => infer R ? R : never }) {
  return (
    <div className="grid gap-1">
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1" {...register} />
        <span>
          <span className="font-medium text-foreground">{label}</span>
          <span className="block text-xs text-muted-foreground">{description}</span>
        </span>
      </label>
      <FieldError id={`${label}-error`} message={error} />
    </div>
  );
}

function FieldLabel(props: React.ComponentProps<"label">) {
  return <label {...props} className={cn("text-sm font-medium text-foreground", props.className)} />;
}

function FieldHint(props: React.ComponentProps<"p">) {
  return <p {...props} className={cn("text-xs text-muted-foreground", props.className)} />;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return <p id={id} className="text-xs font-medium text-destructive">{message}</p>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-lg border border-border/70 bg-background/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap text-sm font-medium text-foreground">{value || "-"}</p>
    </div>
  );
}
