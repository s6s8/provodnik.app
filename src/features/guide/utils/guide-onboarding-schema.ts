import { z } from "zod";

import type { GuideOnboardingData } from "@/features/guide/types/guide-onboarding";

export const guideGovIdTypes = [
  "passport",
  "national_id",
  "drivers_license",
] as const;

export const guideExperienceLevels = [
  "starter",
  "intermediate",
  "expert",
] as const;

export const guideOnboardingSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Укажите имя, которое будут видеть путешественники.")
    .max(60, "Не более 60 символов."),
  tagline: z
    .string()
    .trim()
    .min(2, "Добавьте короткий слоган.")
    .max(80, "Не более 80 символов."),
  bio: z
    .string()
    .trim()
    .min(40, "Добавьте короткое описание (минимум 40 символов).")
    .max(900, "Не более 900 символов."),
  regions: z
    .array(z.string().min(1))
    .min(1, "Выберите хотя бы один регион."),
  languages: z
    .array(z.string().min(1))
    .min(1, "Выберите хотя бы один язык."),
  specialties: z
    .array(z.string().min(1))
    .min(1, "Укажите хотя бы одну специализацию."),
  isAvailable: z.boolean(),
  experienceLevel: z.enum(guideExperienceLevels),
  yearsExperience: z
    .number()
    .int("Используйте целое число.")
    .min(0, "Количество лет не может быть отрицательным.")
    .max(60, "Слишком большое количество лет стажа."),
  currentBaseCity: z
    .string()
    .trim()
    .min(2, "Укажите базовый город.")
    .max(60, "Не более 60 символов."),
  groupSizeMax: z
    .number()
    .int("Используйте целое число.")
    .min(1, "Минимальный размер группы - 1.")
    .max(50, "В MVP максимум 50 человек в группе."),
  hasFirstAidTraining: z.boolean(),
  acceptsPrivateTours: z.boolean(),
  acceptsGroupTours: z.boolean(),
  legalName: z
    .string()
    .trim()
    .min(3, "Укажите полное юридическое имя.")
    .max(100, "Не более 100 символов."),
  birthDate: z.string().min(1, "Укажите дату рождения."),
  citizenshipCountry: z
    .string()
    .trim()
    .min(2, "Укажите страну гражданства.")
    .max(56, "Не более 56 символов."),
  govIdType: z.enum(guideGovIdTypes),
  govIdLast4: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Введите только последние 4 цифры."),
  addressLine1: z
    .string()
    .trim()
    .min(4, "Укажите улицу и дом.")
    .max(120, "Не более 120 символов."),
  addressCity: z
    .string()
    .trim()
    .min(2, "Укажите город.")
    .max(60, "Не более 60 символов."),
  addressCountry: z
    .string()
    .trim()
    .min(2, "Укажите страну.")
    .max(56, "Не более 56 символов."),
  emergencyContactName: z
    .string()
    .trim()
    .min(2, "Добавьте имя контактного лица на случай ЧС.")
    .max(80, "Не более 80 символов."),
  emergencyContactPhone: z
    .string()
    .trim()
    .min(6, "Добавьте телефон контактного лица.")
    .max(30, "Не более 30 символов."),
  referenceName1: z
    .string()
    .trim()
    .min(2, "Добавьте имя первого рекомендателя.")
    .max(80, "Не более 80 символов."),
  referenceContact1: z
    .string()
    .trim()
    .min(4, "Добавьте контакты первого рекомендателя.")
    .max(120, "Не более 120 символов."),
  referenceName2: z
    .string()
    .trim()
    .min(2, "Добавьте имя второго рекомендателя.")
    .max(80, "Не более 80 символов."),
  referenceContact2: z
    .string()
    .trim()
    .min(4, "Добавьте контакты второго рекомендателя.")
    .max(120, "Не более 120 символов."),
  consentBackgroundCheck: z
    .boolean()
    .refine((value) => value, "Нужно согласиться на проверку."),
  attestTruthful: z
    .boolean()
    .refine((value) => value, "Нужно подтвердить достоверность данных."),
});

export type GuideOnboardingValues = z.infer<typeof guideOnboardingSchema>;
type _GuideOnboardingShapeCheck =
  GuideOnboardingValues extends GuideOnboardingData
    ? GuideOnboardingData extends GuideOnboardingValues
      ? true
      : never
    : never;
