import { z } from "zod";

export const guideOfferInclusionDefaults = [
  "Guiding service",
  "Itinerary planning",
  "Local recommendations",
] as const;

export const guideOfferSchema = z.object({
  priceTotalRub: z
    .number()
    .int("Use a whole number.")
    .min(1_000, "Price should be at least RUB 1,000.")
    .max(10_000_000, "Price looks too high for MVP."),
  timingSummary: z
    .string()
    .trim()
    .min(6, "Provide a short timing note.")
    .max(140, "Keep it under 140 characters."),
  capacity: z
    .number()
    .int("Use a whole number.")
    .min(1, "Capacity must be at least 1.")
    .max(50, "For MVP, cap capacity at 50."),
  inclusions: z
    .array(z.string().trim().min(2, "Keep inclusion items readable."))
    .min(1, "Add at least one inclusion."),
  expiresAt: z.string().min(1, "Pick an expiry time."),
  notes: z
    .string()
    .trim()
    .max(600, "Keep notes under 600 characters.")
    .optional()
    .or(z.literal("")),
});

export type GuideOfferDraft = z.infer<typeof guideOfferSchema>;

