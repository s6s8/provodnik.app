import { z } from "zod";

export const destinationKinds = ["city", "region", "country"] as const;

export const destinationSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, "Destination slug must be at least 2 characters.")
    .max(80, "Keep destination slug under 80 characters."),
  kind: z.enum(destinationKinds),
  label: z
    .string()
    .trim()
    .min(2, "Destination label must be at least 2 characters.")
    .max(120, "Keep destination label under 120 characters."),
  countryCode: z
    .string()
    .trim()
    .length(2, "Use a 2-letter country code.")
    .transform((value) => value.toUpperCase()),
  region: z.string().trim().max(120, "Keep region under 120 characters.").optional(),
  heroImageUrl: z.string().url().optional(),
});

export type Destination = z.infer<typeof destinationSchema>;

