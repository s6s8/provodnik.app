import { z } from "zod";

export const listingMealSchema = z.object({
  listing_id: z.string().uuid(),
  day_number: z.number().int().min(1),
  meal_type: z.enum(["breakfast", "lunch", "dinner"]),
  status: z.enum(["included", "paid_extra", "not_included"]),
  note: z.string().trim().nullable(),
});

export type ListingMealInput = z.infer<typeof listingMealSchema>;
