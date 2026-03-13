"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, RotateCcw, ShieldCheck } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import {
  guideExperienceLevels,
  guideGovIdTypes,
  guideOnboardingSchema,
  type GuideOnboardingValues,
} from "@/features/guide/utils/guide-onboarding-schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { AuthContext } from "@/lib/auth/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ensureGuideDocumentReservations } from "@/data/guide-assets/supabase-client";
import type {
  GuideProfileRow,
  GuideVerificationStatusDb,
} from "@/lib/supabase/types";

function splitCommaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatGovIdType(value: (typeof guideGovIdTypes)[number]): string {
  switch (value) {
    case "passport":
      return "Загранпаспорт";
    case "national_id":
      return "Внутренний паспорт / ID-карта";
    case "drivers_license":
      return "Водительское удостоверение";
    default: {
      const exhaustive: never = value;
      return exhaustive;
    }
  }
}

function formatExperienceLevel(
  value: (typeof guideExperienceLevels)[number]
): string {
  switch (value) {
    case "starter":
      return "Начинающий";
    case "intermediate":
      return "Опытный";
    case "expert":
      return "Эксперт";
    default: {
      const exhaustive: never = value;
      return exhaustive;
    }
  }
}

type GuideOnboardingFormProps = {
  auth: AuthContext;
};

export function GuideOnboardingForm({ auth }: GuideOnboardingFormProps) {
  const [submitted, setSubmitted] = React.useState<GuideOnboardingValues | null>(
    null
  );
  const [persistedToBackend, setPersistedToBackend] = React.useState(false);
  const [backendError, setBackendError] = React.useState<string | null>(null);
  const [documentReservations, setDocumentReservations] = React.useState<
    Array<{ documentType: string; objectPath: string; status: GuideVerificationStatusDb }>
  >([]);

  const canPersistToSupabase =
    auth.hasSupabaseEnv && auth.isAuthenticated && auth.source === "supabase";

  const form = useForm<GuideOnboardingValues>({
    resolver: zodResolver(guideOnboardingSchema),
    defaultValues: {
      displayName: "",
      tagline: "",
      bio: "",
      regions: [],
      languages: [],
      specialties: [],
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    control,
  } = form;

  const onSubmit = React.useCallback(async (values: GuideOnboardingValues) => {
    setBackendError(null);

    if (canPersistToSupabase) {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!user || userError) {
          setPersistedToBackend(false);
          setBackendError(
            "Сессия недоступна — данные анкеты сохранены только локально в этом браузере."
          );
          setSubmitted(values);
          return;
        }

        const verificationStatus: GuideVerificationStatusDb =
          values.consentBackgroundCheck && values.attestTruthful
            ? "submitted"
            : "draft";

        const verificationNotesParts: string[] = [
          `Базовый город: ${values.currentBaseCity}`,
          `Регионы: ${values.regions.join(", ")}`,
          `Языки: ${values.languages.join(", ")}`,
          `Специализации: ${values.specialties.join(", ")}`,
          `Лет опыта: ${values.yearsExperience}`,
          `Максимальный размер группы: ${values.groupSizeMax}`,
          `Обучение первой помощи: ${values.hasFirstAidTraining ? "да" : "нет"}`,
          `Принимает частные туры: ${values.acceptsPrivateTours ? "да" : "нет"}`,
          `Принимает групповые туры: ${values.acceptsGroupTours ? "да" : "нет"}`,
          `Контакт на случай ЧС: ${values.emergencyContactName} / ${values.emergencyContactPhone}`,
          `Рекомендации: ${values.referenceName1} / ${values.referenceContact1}; ${values.referenceName2} / ${values.referenceContact2}`,
          `Согласие на проверку благонадёжности: ${
            values.consentBackgroundCheck ? "да" : "нет"
          }`,
          `Подтверждение достоверности: ${values.attestTruthful ? "да" : "нет"}`,
        ];

        const payload: Partial<GuideProfileRow> = {
          user_id: user.id,
          display_name: values.displayName,
          bio: values.bio,
          years_experience: values.yearsExperience,
          regions: values.regions,
          languages: values.languages,
          specialties: values.specialties,
          verification_status: verificationStatus,
          verification_notes: verificationNotesParts.join(" | "),
        };

        const { error: upsertError } = await supabase
          .from("guide_profiles")
          .upsert(payload, { onConflict: "user_id" });

        if (upsertError) {
          setPersistedToBackend(false);
          setBackendError(
            "Не удалось связаться с бэкендом — данные анкеты сохранены только локально в этом браузере."
          );
          setSubmitted(values);
          return;
        }

        const reservations = await ensureGuideDocumentReservations(
          user.id,
          verificationStatus
        );

        setDocumentReservations(
          reservations.map((item) => ({
            documentType: item.documentType,
            objectPath: item.objectPath,
            status: item.status,
          }))
        );
        setPersistedToBackend(true);
      } catch (error) {
        console.error("Failed to persist guide onboarding to Supabase", error);
        setPersistedToBackend(false);
        setDocumentReservations([]);
        setBackendError(
          "Не удалось связаться с бэкендом — данные анкеты сохранены только локально в этом браузере."
        );
        setSubmitted(values);
        return;
      }
    } else {
      setPersistedToBackend(false);
      setDocumentReservations([]);
    }

    setSubmitted(values);
  }, [canPersistToSupabase]);

  const handleStartOver = React.useCallback(() => {
    setSubmitted(null);
    setDocumentReservations([]);
    reset();
  }, [reset]);

  const regions = useWatch({ control, name: "regions" }) ?? [];
  const languages = useWatch({ control, name: "languages" }) ?? [];
  const specialties = useWatch({ control, name: "specialties" }) ?? [];

  if (submitted) {
    return (
      <div className="space-y-4">
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="flex flex-row items-start gap-4 space-y-0">
            <div className="mt-0.5 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CheckCircle2 className="size-5" />
            </div>
            <div className="space-y-1">
              <CardTitle>
                {persistedToBackend
                  ? "Анкета сохранена в Supabase"
                  : "Анкета сохранена локально"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {persistedToBackend
                  ? "Данные анкеты записаны в профиль гида в Supabase. Ниже — сводка по введённой информации."
                  : "В этом режиме анкета хранится только в этом браузере. Ниже — сводка по введённой информации."}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <SummarySection title="Основы профиля">
              <SummaryRow label="Имя для профиля" value={submitted.displayName} />
              <SummaryRow label="Слоган" value={submitted.tagline} />
              <SummaryRow label="О себе" value={submitted.bio} />
              <SummaryRow
                label="Регионы"
                value={submitted.regions.length ? submitted.regions.join(", ") : "-"}
              />
              <SummaryRow
                label="Языки"
                value={
                  submitted.languages.length ? submitted.languages.join(", ") : "-"
                }
              />
              <SummaryRow
                label="Специализации"
                value={
                  submitted.specialties.length
                    ? submitted.specialties.join(", ")
                    : "-"
                }
              />
            </SummarySection>

            <SummarySection title="Операционные параметры">
              <SummaryRow
                label="Уровень опыта"
                value={formatExperienceLevel(submitted.experienceLevel)}
              />
              <SummaryRow
                label="Лет опыта"
                value={`${submitted.yearsExperience}`}
              />
              <SummaryRow label="Базовый город" value={submitted.currentBaseCity} />
              <SummaryRow
                label="Максимальный размер группы"
                value={`${submitted.groupSizeMax}`}
              />
              <SummaryRow
                label="Подтверждённый курс первой помощи"
                value={submitted.hasFirstAidTraining ? "Да" : "Нет"}
              />
              <SummaryRow
                label="Принимает частные туры"
                value={submitted.acceptsPrivateTours ? "Да" : "Нет"}
              />
              <SummaryRow
                label="Принимает групповые туры"
                value={submitted.acceptsGroupTours ? "Да" : "Нет"}
              />
            </SummarySection>

            <SummarySection title="Личность и проверка">
              <SummaryRow label="Юридическое имя" value={submitted.legalName} />
              <SummaryRow label="Дата рождения" value={submitted.birthDate} />
              <SummaryRow
                label="Страна гражданства"
                value={submitted.citizenshipCountry}
              />
              <SummaryRow
                label="Тип документа"
                value={formatGovIdType(submitted.govIdType)}
              />
              <SummaryRow label="Последние 4 цифры документа" value={submitted.govIdLast4} />
              <SummaryRow label="Адрес (улица и дом)" value={submitted.addressLine1} />
              <SummaryRow label="Город" value={submitted.addressCity} />
              <SummaryRow label="Страна" value={submitted.addressCountry} />
              <SummaryRow
                label="Контакт на случай ЧС"
                value={`${submitted.emergencyContactName} / ${submitted.emergencyContactPhone}`}
              />
            </SummarySection>

            <SummarySection title="Рекомендации">
              <SummaryRow
                label="Рекомендатель 1"
                value={`${submitted.referenceName1} / ${submitted.referenceContact1}`}
              />
              <SummaryRow
                label="Рекомендатель 2"
                value={`${submitted.referenceName2} / ${submitted.referenceContact2}`}
              />
            </SummarySection>

            <SummarySection title="Согласия">
              <div className="grid gap-2 rounded-lg border border-border/70 bg-background/60 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ShieldCheck className="size-4 text-primary" />
                  <span>Анкета для проверки сохранена</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Согласие на проверку благонадёжности:{" "}
                  <span className="font-medium text-foreground">
                    {submitted.consentBackgroundCheck ? "Да" : "Нет"}
                  </span>
                  . Подтверждение достоверности:{" "}
                  <span className="font-medium text-foreground">
                    {submitted.attestTruthful ? "Да" : "Нет"}
                  </span>
                  .
                </p>
              </div>
            </SummarySection>

            {persistedToBackend && documentReservations.length > 0 ? (
              <SummarySection title="Зарезервированные пути документов в бэкенде">
                {documentReservations.map((item) => (
                  <SummaryRow
                    key={item.documentType}
                    label={`${item.documentType} (${item.status})`}
                    value={item.objectPath}
                  />
                ))}
              </SummarySection>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" onClick={handleStartOver}>
            Заполнить заново
            <RotateCcw className="size-4" />
          </Button>
          {backendError ? (
            <p className="text-sm text-muted-foreground sm:ml-2">{backendError}</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <form
      className="grid gap-6"
      onSubmit={handleSubmit(onSubmit)}
      aria-label="Анкета гида и данные для проверки"
    >
      <SectionHeader
        badge="Профиль"
        title="Публичный профиль"
        description="То, что видят путешественники при выборе гида."
      />

      <div className="grid gap-4">
        <div className="grid gap-2">
          <FieldLabel htmlFor="displayName">Имя в профиле</FieldLabel>
          <Input
            id="displayName"
            placeholder="Например, Амина К."
            autoComplete="nickname"
            aria-invalid={Boolean(errors.displayName)}
            aria-describedby={errors.displayName ? "displayName-error" : undefined}
            {...register("displayName")}
          />
          <FieldHint>Имя, по которому вас легко узнать и найти.</FieldHint>
          <FieldError id="displayName-error" message={errors.displayName?.message} />
        </div>

        <div className="grid gap-2">
          <FieldLabel htmlFor="tagline">Слоган</FieldLabel>
          <Input
            id="tagline"
            placeholder="Например, спокойные прогулки + скрытые кафе"
            autoComplete="off"
            aria-invalid={Boolean(errors.tagline)}
            aria-describedby={errors.tagline ? "tagline-error" : undefined}
            {...register("tagline")}
          />
          <FieldHint>Короткая фраза, которая помещается в карточку.</FieldHint>
          <FieldError id="tagline-error" message={errors.tagline?.message} />
        </div>

        <div className="grid gap-2">
          <FieldLabel htmlFor="bio">О себе</FieldLabel>
          <Textarea
            id="bio"
            placeholder="Расскажите, что вы любите показывать, как ведёте группы и чего ждать от тура."
            aria-invalid={Boolean(errors.bio)}
            aria-describedby={errors.bio ? "bio-error" : undefined}
            {...register("bio")}
          />
          <FieldHint>От 40 символов. Конкретика, без «воды».</FieldHint>
          <FieldError id="bio-error" message={errors.bio?.message} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="regions">Регионы</FieldLabel>
            <Input
              id="regions"
              placeholder="Например, Москва, Казань, Алтай"
              autoComplete="off"
              aria-invalid={Boolean(errors.regions)}
              aria-describedby={errors.regions ? "regions-error" : undefined}
              value={regions.join(", ")}
              onChange={(event) => {
                setValue("regions", splitCommaList(event.target.value), {
                  shouldTouch: true,
                  shouldValidate: true,
                });
              }}
            />
            <FieldHint>Список через запятую. Минимум один регион.</FieldHint>
            <FieldError
              id="regions-error"
              message={typeof errors.regions?.message === "string" ? errors.regions.message : undefined}
            />
          </div>

          <div className="grid gap-2">
            <FieldLabel htmlFor="languages">Языки</FieldLabel>
            <Input
              id="languages"
              placeholder="Например, русский, английский"
              autoComplete="off"
              aria-invalid={Boolean(errors.languages)}
              aria-describedby={errors.languages ? "languages-error" : undefined}
              value={languages.join(", ")}
              onChange={(event) => {
                setValue("languages", splitCommaList(event.target.value), {
                  shouldTouch: true,
                  shouldValidate: true,
                });
              }}
            />
            <FieldHint>Список через запятую. Минимум один язык.</FieldHint>
            <FieldError
              id="languages-error"
              message={
                typeof errors.languages?.message === "string"
                  ? errors.languages.message
                  : undefined
              }
            />
          </div>
        </div>

        <div className="grid gap-2">
            <FieldLabel htmlFor="specialties">Специализации</FieldLabel>
          <Input
            id="specialties"
              placeholder="Например, история, стритфуд, походы"
            autoComplete="off"
            aria-invalid={Boolean(errors.specialties)}
            aria-describedby={errors.specialties ? "specialties-error" : undefined}
            value={specialties.join(", ")}
            onChange={(event) => {
              setValue("specialties", splitCommaList(event.target.value), {
                shouldTouch: true,
                shouldValidate: true,
              });
            }}
          />
          <FieldHint>Список через запятую. Минимум одно направление.</FieldHint>
          <FieldError
            id="specialties-error"
            message={
              typeof errors.specialties?.message === "string"
                ? errors.specialties.message
                : undefined
            }
          />
        </div>
      </div>

      <Separator className="my-1" />

      <SectionHeader
        badge="Операции"
        title="Как вы ведёте туры"
        description="Задайте рамки по формату, размеру групп и доступности."
      />

      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="experienceLevel">Уровень опыта</FieldLabel>
            <select
              id="experienceLevel"
              aria-invalid={Boolean(errors.experienceLevel)}
              aria-describedby={
                errors.experienceLevel ? "experienceLevel-error" : undefined
              }
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
              {...register("experienceLevel")}
            >
              {guideExperienceLevels.map((level) => (
                <option key={level} value={level}>
                  {formatExperienceLevel(level)}
                </option>
              ))}
            </select>
            <FieldError
              id="experienceLevel-error"
              message={errors.experienceLevel?.message}
            />
          </div>

          <div className="grid gap-2">
            <FieldLabel htmlFor="yearsExperience">Лет опыта</FieldLabel>
            <Input
              id="yearsExperience"
              type="number"
              inputMode="numeric"
              min={0}
              max={60}
              aria-invalid={Boolean(errors.yearsExperience)}
              aria-describedby={
                errors.yearsExperience ? "yearsExperience-error" : undefined
              }
              {...register("yearsExperience", { valueAsNumber: true })}
            />
            <FieldError
              id="yearsExperience-error"
              message={errors.yearsExperience?.message}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="currentBaseCity">Базовый город</FieldLabel>
            <Input
              id="currentBaseCity"
              placeholder="Например, Санкт‑Петербург"
              autoComplete="address-level2"
              aria-invalid={Boolean(errors.currentBaseCity)}
              aria-describedby={
                errors.currentBaseCity ? "currentBaseCity-error" : undefined
              }
              {...register("currentBaseCity")}
            />
            <FieldHint>Город, откуда чаще всего стартуют туры.</FieldHint>
            <FieldError
              id="currentBaseCity-error"
              message={errors.currentBaseCity?.message}
            />
          </div>

          <div className="grid gap-2">
            <FieldLabel htmlFor="groupSizeMax">Максимальный размер группы</FieldLabel>
            <Input
              id="groupSizeMax"
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              aria-invalid={Boolean(errors.groupSizeMax)}
              aria-describedby={errors.groupSizeMax ? "groupSizeMax-error" : undefined}
              {...register("groupSizeMax", { valueAsNumber: true })}
            />
            <FieldHint>В этой версии максимум 50 человек.</FieldHint>
            <FieldError id="groupSizeMax-error" message={errors.groupSizeMax?.message} />
          </div>
        </div>

        <fieldset className="grid gap-2" aria-label="Параметры работы">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" {...register("hasFirstAidTraining")} />
            <span>
              <span className="font-medium text-foreground">Обучение первой помощи</span>
              <span className="block text-xs text-muted-foreground">
                Покажите гостям, что у вас есть действующий курс первой помощи.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" {...register("acceptsPrivateTours")} />
            <span>
              <span className="font-medium text-foreground">Принимаю частные туры</span>
              <span className="block text-xs text-muted-foreground">
                Готовы работать с одной компанией за раз.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" {...register("acceptsGroupTours")} />
            <span>
              <span className="font-medium text-foreground">Принимаю групповые туры</span>
              <span className="block text-xs text-muted-foreground">
                Готовы объединять несколько путешественников в одну группу.
              </span>
            </span>
          </label>
        </fieldset>
      </div>

      <Separator className="my-1" />

      <SectionHeader
        badge="Проверка"
        title="Данные для верификации"
        description="Нужно для платных туров. Пока всё хранится локально на этом устройстве."
      />

      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="legalName">Юридическое имя</FieldLabel>
            <Input
              id="legalName"
              placeholder="Как в паспорте или ID‑карте"
              autoComplete="name"
              aria-invalid={Boolean(errors.legalName)}
              aria-describedby={errors.legalName ? "legalName-error" : undefined}
              {...register("legalName")}
            />
            <FieldError id="legalName-error" message={errors.legalName?.message} />
          </div>

          <div className="grid gap-2">
            <FieldLabel htmlFor="birthDate">Дата рождения</FieldLabel>
            <Input
              id="birthDate"
              type="date"
              aria-invalid={Boolean(errors.birthDate)}
              aria-describedby={errors.birthDate ? "birthDate-error" : undefined}
              {...register("birthDate")}
            />
            <FieldError id="birthDate-error" message={errors.birthDate?.message} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="citizenshipCountry">Страна гражданства</FieldLabel>
            <Input
              id="citizenshipCountry"
              placeholder="Например, Россия"
              autoComplete="country"
              aria-invalid={Boolean(errors.citizenshipCountry)}
              aria-describedby={
                errors.citizenshipCountry ? "citizenshipCountry-error" : undefined
              }
              {...register("citizenshipCountry")}
            />
            <FieldError
              id="citizenshipCountry-error"
              message={errors.citizenshipCountry?.message}
            />
          </div>

          <div className="grid gap-2">
            <FieldLabel htmlFor="govIdType">Тип документа</FieldLabel>
            <select
              id="govIdType"
              aria-invalid={Boolean(errors.govIdType)}
              aria-describedby={errors.govIdType ? "govIdType-error" : undefined}
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
              {...register("govIdType")}
            >
              {guideGovIdTypes.map((type) => (
                <option key={type} value={type}>
                  {formatGovIdType(type)}
                </option>
              ))}
            </select>
            <FieldError id="govIdType-error" message={errors.govIdType?.message} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="govIdLast4">Последние 4 цифры документа</FieldLabel>
            <Input
              id="govIdLast4"
              placeholder="1234"
              inputMode="numeric"
              autoComplete="off"
              aria-invalid={Boolean(errors.govIdLast4)}
              aria-describedby={errors.govIdLast4 ? "govIdLast4-error" : undefined}
              {...register("govIdLast4")}
            />
            <FieldHint>Не указывайте полный номер документа.</FieldHint>
            <FieldError id="govIdLast4-error" message={errors.govIdLast4?.message} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <FieldLabel htmlFor="addressLine1">Адрес (улица и дом)</FieldLabel>
            <Input
              id="addressLine1"
              placeholder="Улица и дом"
              autoComplete="street-address"
              aria-invalid={Boolean(errors.addressLine1)}
              aria-describedby={errors.addressLine1 ? "addressLine1-error" : undefined}
              {...register("addressLine1")}
            />
            <FieldError id="addressLine1-error" message={errors.addressLine1?.message} />
          </div>

          <div className="grid gap-2">
            <FieldLabel htmlFor="addressCity">Город</FieldLabel>
            <Input
              id="addressCity"
              placeholder="Город"
              autoComplete="address-level2"
              aria-invalid={Boolean(errors.addressCity)}
              aria-describedby={errors.addressCity ? "addressCity-error" : undefined}
              {...register("addressCity")}
            />
            <FieldError id="addressCity-error" message={errors.addressCity?.message} />
          </div>

          <div className="grid gap-2">
            <FieldLabel htmlFor="addressCountry">Страна</FieldLabel>
            <Input
              id="addressCountry"
              placeholder="Страна"
              autoComplete="country"
              aria-invalid={Boolean(errors.addressCountry)}
              aria-describedby={errors.addressCountry ? "addressCountry-error" : undefined}
              {...register("addressCountry")}
            />
            <FieldError
              id="addressCountry-error"
              message={errors.addressCountry?.message}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="emergencyContactName">
              Имя контактного лица на случай ЧС
            </FieldLabel>
            <Input
              id="emergencyContactName"
              placeholder="Полное имя"
              autoComplete="off"
              aria-invalid={Boolean(errors.emergencyContactName)}
              aria-describedby={
                errors.emergencyContactName ? "emergencyContactName-error" : undefined
              }
              {...register("emergencyContactName")}
            />
            <FieldError
              id="emergencyContactName-error"
              message={errors.emergencyContactName?.message}
            />
          </div>

          <div className="grid gap-2">
            <FieldLabel htmlFor="emergencyContactPhone">
              Телефон контактного лица
            </FieldLabel>
            <Input
              id="emergencyContactPhone"
              placeholder="+7 999 000‑00‑00"
              autoComplete="tel"
              aria-invalid={Boolean(errors.emergencyContactPhone)}
              aria-describedby={
                errors.emergencyContactPhone ? "emergencyContactPhone-error" : undefined
              }
              {...register("emergencyContactPhone")}
            />
            <FieldError
              id="emergencyContactPhone-error"
              message={errors.emergencyContactPhone?.message}
            />
          </div>
        </div>
      </div>

      <Separator className="my-1" />

      <SectionHeader
        badge="Рекомендации"
        title="Профессиональные рекомендации"
        description="Два человека, которые могут подтвердить ваш опыт гида."
      />

      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="referenceName1">Имя рекомендателя 1</FieldLabel>
            <Input
              id="referenceName1"
              placeholder="Полное имя"
              autoComplete="off"
              aria-invalid={Boolean(errors.referenceName1)}
              aria-describedby={errors.referenceName1 ? "referenceName1-error" : undefined}
              {...register("referenceName1")}
            />
            <FieldError
              id="referenceName1-error"
              message={errors.referenceName1?.message}
            />
          </div>

          <div className="grid gap-2">
            <FieldLabel htmlFor="referenceContact1">Контакты рекомендателя 1</FieldLabel>
            <Input
              id="referenceContact1"
              placeholder="Телефон, email или ссылка"
              autoComplete="off"
              aria-invalid={Boolean(errors.referenceContact1)}
              aria-describedby={
                errors.referenceContact1 ? "referenceContact1-error" : undefined
              }
              {...register("referenceContact1")}
            />
            <FieldError
              id="referenceContact1-error"
              message={errors.referenceContact1?.message}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <FieldLabel htmlFor="referenceName2">Имя рекомендателя 2</FieldLabel>
            <Input
              id="referenceName2"
              placeholder="Полное имя"
              autoComplete="off"
              aria-invalid={Boolean(errors.referenceName2)}
              aria-describedby={errors.referenceName2 ? "referenceName2-error" : undefined}
              {...register("referenceName2")}
            />
            <FieldError
              id="referenceName2-error"
              message={errors.referenceName2?.message}
            />
          </div>

          <div className="grid gap-2">
            <FieldLabel htmlFor="referenceContact2">Контакты рекомендателя 2</FieldLabel>
            <Input
              id="referenceContact2"
              placeholder="Телефон, email или ссылка"
              autoComplete="off"
              aria-invalid={Boolean(errors.referenceContact2)}
              aria-describedby={
                errors.referenceContact2 ? "referenceContact2-error" : undefined
              }
              {...register("referenceContact2")}
            />
            <FieldError
              id="referenceContact2-error"
              message={errors.referenceContact2?.message}
            />
          </div>
        </div>
      </div>

      <Separator className="my-1" />

      <SectionHeader
        badge="Согласия"
        title="Согласия и подтверждения"
        description="Обязательные пункты для запуска проверки."
      />

      <div className="grid gap-3">
        <div className="grid gap-1">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" {...register("consentBackgroundCheck")} />
            <span>
              <span className="font-medium text-foreground">
                    Я согласен(а) на проверку благонадёжности
              </span>
              <span className="block text-xs text-muted-foreground">
                    Это обязательное условие перед приёмом платных бронирований.
              </span>
            </span>
          </label>
          <FieldError
            id="consentBackgroundCheck-error"
            message={errors.consentBackgroundCheck?.message}
          />
        </div>

        <div className="grid gap-1">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" {...register("attestTruthful")} />
            <span>
              <span className="font-medium text-foreground">
                    Подтверждаю, что данные указаны честно и без искажений
              </span>
              <span className="block text-xs text-muted-foreground">
                    Предоставление ложных данных может привести к блокировке профиля.
              </span>
            </span>
          </label>
          <FieldError id="attestTruthful-error" message={errors.attestTruthful?.message} />
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Проверьте данные внимательно — поля для проверки критичны для работы.
        </p>
        <Button type="submit" disabled={isSubmitting}>
          Сохранить анкету (локально)
        </Button>
      </div>
    </form>
  );
}

function SectionHeader({
  badge,
  title,
  description,
}: {
  badge: string;
  title: string;
  description: string;
}) {
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

function FieldLabel(props: React.ComponentProps<"label">) {
  return (
    <label
      {...props}
      className={cn("text-sm font-medium text-foreground", props.className)}
    />
  );
}

function FieldHint({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p {...props} className={cn("text-xs text-muted-foreground", className)} />
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p id={id} className="text-xs font-medium text-destructive">
      {message}
    </p>
  );
}

function SummarySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <div className="grid gap-2">{children}</div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-lg border border-border/70 bg-background/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground whitespace-pre-wrap">
        {value}
      </p>
    </div>
  );
}

