import { z } from "zod";

export const listingDaySchema = z.object({
  listing_id: z.string().uuid(),
  day_number: z.number().int().min(1).max(30),
  title: z.string().trim().max(120).nullable(),
  body: z.string().trim().nullable(),
  date_override: z.string().nullable(),
});

export type ListingDayInput = z.infer<typeof listingDaySchema>;
