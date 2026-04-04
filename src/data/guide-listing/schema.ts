import { z } from "zod";

export const guideListingStatuses = [
  "draft",
  "active",
  "paused",
  "archived",
] as const;

export const guideListingPricingModes = ["per_person", "per_group"] as const;

export const guideListingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title should be at least 3 characters.")
    .max(80, "Keep the title under 80 characters."),
  region: z
    .string()
    .trim()
    .min(2, "Region is required.")
    .max(60, "Keep the region under 60 characters."),
  durationHours: z
    .number()
    .finite()
    .min(0.5, "Duration must be at least 0.5 hours.")
    .max(240, "For MVP, cap duration at 240 hours."),
  capacity: z
    .number()
    .int("Use a whole number.")
    .min(1, "Capacity must be at least 1.")
    .max(50, "For MVP, cap capacity at 50."),
  inclusions: z
    .array(z.string().trim().min(2, "Keep inclusion items readable."))
    .min(0),
  exclusions: z
    .array(z.string().trim().min(2, "Keep exclusion items readable."))
    .min(0),
  pricing: z.object({
    mode: z.enum(guideListingPricingModes),
    priceRub: z
      .number()
      .int("Use a whole number.")
      .min(0, "Price cannot be negative.")
      .max(10_000_000, "Price looks too high for MVP."),
  }),
  status: z.enum(guideListingStatuses),
});

export type GuideListing = z.infer<typeof guideListingSchema>;
