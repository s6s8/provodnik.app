import { z } from "zod";

export const listingTariffSchema = z.object({
  listing_id: z.string().uuid(),
  label: z.string().trim().min(1).max(80),
  price_minor: z.number().int().min(0),
  currency: z.string().length(3).default("RUB"),
  min_persons: z.number().int().min(1).nullable(),
  max_persons: z.number().int().min(1).nullable(),
});

export type ListingTariffInput = z.infer<typeof listingTariffSchema>;
