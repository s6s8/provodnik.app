import { z } from "zod";

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
    .min(2, "Tell us the name travelers should see.")
    .max(60, "Keep it under 60 characters."),
  tagline: z
    .string()
    .trim()
    .min(2, "Add a short tagline.")
    .max(80, "Keep it under 80 characters."),
  bio: z
    .string()
    .trim()
    .min(40, "Add a short bio (40 characters minimum).")
    .max(900, "Keep the bio under 900 characters."),
  regions: z
    .array(z.string().min(1))
    .min(1, "Pick at least one region."),
  languages: z
    .array(z.string().min(1))
    .min(1, "Pick at least one language."),
  specialties: z
    .array(z.string().min(1))
    .min(1, "Pick at least one specialty."),
  experienceLevel: z.enum(guideExperienceLevels),
  yearsExperience: z
    .number()
    .int("Use a whole number.")
    .min(0, "Years cannot be negative.")
    .max(60, "Years looks too high."),
  currentBaseCity: z
    .string()
    .trim()
    .min(2, "Add your base city.")
    .max(60, "Keep it under 60 characters."),
  groupSizeMax: z
    .number()
    .int("Use a whole number.")
    .min(1, "Minimum group size is 1.")
    .max(50, "For MVP baseline, cap group size at 50."),
  hasFirstAidTraining: z.boolean(),
  acceptsPrivateTours: z.boolean(),
  acceptsGroupTours: z.boolean(),
  legalName: z
    .string()
    .trim()
    .min(3, "Enter your legal name.")
    .max(100, "Keep it under 100 characters."),
  birthDate: z.string().min(1, "Pick your birth date."),
  citizenshipCountry: z
    .string()
    .trim()
    .min(2, "Enter citizenship country.")
    .max(56, "Keep it under 56 characters."),
  govIdType: z.enum(guideGovIdTypes),
  govIdLast4: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Use the last 4 digits."),
  addressLine1: z
    .string()
    .trim()
    .min(4, "Enter your street address.")
    .max(120, "Keep it under 120 characters."),
  addressCity: z
    .string()
    .trim()
    .min(2, "Enter your city.")
    .max(60, "Keep it under 60 characters."),
  addressCountry: z
    .string()
    .trim()
    .min(2, "Enter your country.")
    .max(56, "Keep it under 56 characters."),
  emergencyContactName: z
    .string()
    .trim()
    .min(2, "Add an emergency contact name.")
    .max(80, "Keep it under 80 characters."),
  emergencyContactPhone: z
    .string()
    .trim()
    .min(6, "Add an emergency contact phone.")
    .max(30, "Keep it under 30 characters."),
  referenceName1: z
    .string()
    .trim()
    .min(2, "Add a reference name.")
    .max(80, "Keep it under 80 characters."),
  referenceContact1: z
    .string()
    .trim()
    .min(4, "Add a reference contact.")
    .max(120, "Keep it under 120 characters."),
  referenceName2: z
    .string()
    .trim()
    .min(2, "Add a second reference name.")
    .max(80, "Keep it under 80 characters."),
  referenceContact2: z
    .string()
    .trim()
    .min(4, "Add a second reference contact.")
    .max(120, "Keep it under 120 characters."),
  consentBackgroundCheck: z
    .boolean()
    .refine((value) => value, "Consent is required."),
  attestTruthful: z.boolean().refine((value) => value, "Attestation is required."),
});

export type GuideOnboardingValues = z.infer<typeof guideOnboardingSchema>;

