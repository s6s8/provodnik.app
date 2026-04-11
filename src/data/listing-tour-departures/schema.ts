import { z } from "zod";

export const listingTourDepartureSchema = z.object({
  listing_id: z.string().uuid(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "ISO date required"),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "ISO date required"),
  price_minor: z.number().int().min(0),
  currency: z.string().length(3).default("RUB"),
  max_persons: z.number().int().min(1),
  status: z.string().default("open"),
});

export type ListingTourDepartureInput = z.infer<typeof listingTourDepartureSchema>;
