/**
 * listing-schema.ts — Zod schema for listing create/update input.
 * Pure client-safe module — no server-only imports.
 */

import { z } from "zod";

export const listingInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Минимум 3 символа.")
    .max(100, "Не более 100 символов."),
  description: z.string().trim().max(2000, "Не более 2000 символов.").optional(),
  destination: z
    .string()
    .trim()
    .min(2, "Укажите направление.")
    .max(80, "Не более 80 символов."),
  price_per_person: z
    .number()
    .int("Используйте целое число.")
    .min(0, "Цена не может быть отрицательной.")
    .max(10_000_000, "Слишком высокая цена."),
  max_group_size: z
    .number()
    .int("Используйте целое число.")
    .min(1, "Минимум 1 участник.")
    .max(50, "Максимум 50 участников."),
  duration_days: z
    .number()
    .int("Используйте целое число.")
    .min(1, "Минимум 1 день.")
    .max(365, "Не более 365 дней."),
  included: z.string().trim().max(1000, "Не более 1000 символов.").optional(),
  excluded: z.string().trim().max(1000, "Не более 1000 символов.").optional(),
});

export type ListingInput = z.infer<typeof listingInputSchema>;
