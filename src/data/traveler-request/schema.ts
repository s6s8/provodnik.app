import { z } from "zod";

export const travelerRequestModes = ["assembly", "private"] as const;

const timeRegex = /^\d{2}:\d{2}$/;

export const travelerRequestSchema = z
  .object({
    mode: z.enum(travelerRequestModes),
    interests: z.array(z.string()).min(1, "Выберите хотя бы одну категорию"),
    destination: z
      .string()
      .trim()
      .min(2, "Tell us where you want to go.")
      .max(80, "Keep it under 80 characters."),
    startDate: z.string().min(1, "Pick a start date."),
    dateFlexibility: z.enum(['exact', 'few_days', 'week']).default('exact'),
    startTime: z
      .string()
      .regex(timeRegex, "Формат времени: ЧЧ:ММ")
      .optional()
      .or(z.literal("")),
    endTime: z
      .string()
      .regex(timeRegex, "Формат времени: ЧЧ:ММ")
      .optional()
      .or(z.literal("")),
    // assembly mode counters
    groupSizeCurrent: z
      .number()
      .int("Use a whole number.")
      .min(1, "Minimum 1 traveler.")
      .max(20, "For MVP, cap group size at 20.")
      .optional(),
    groupMax: z
      .number()
      .int("Use a whole number.")
      .min(1, "Minimum 1.")
      .max(50, "Maximum 50.")
      .optional(),
    // private mode counter
    groupSize: z
      .number()
      .int("Use a whole number.")
      .min(1, "Minimum 1 traveler.")
      .max(20, "For MVP, cap group size at 20.")
      .optional(),
    allowGuideSuggestionsOutsideConstraints: z.boolean(),
    budgetPerPersonRub: z
      .number()
      .int("Use a whole number.")
      .min(1_000, "Budget should be at least RUB 1,000.")
      .max(2_000_000, "Budget looks too high for MVP."),
    notes: z
      .string()
      .trim()
      .max(800, "Keep notes under 800 characters.")
      .optional()
      .or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    const start = new Date(value.startDate);

    if (Number.isNaN(start.getTime())) {
      ctx.addIssue({
        code: "custom",
        path: ["startDate"],
        message: "Start date is not valid.",
      });
    }

    if (value.mode === "assembly") {
      if (!value.groupSizeCurrent) {
        ctx.addIssue({
          code: "custom",
          path: ["groupSizeCurrent"],
          message: "Укажите текущее количество участников.",
        });
      }
    }

    if (value.mode === "private") {
      if (!value.groupSize) {
        ctx.addIssue({
          code: "custom",
          path: ["groupSize"],
          message: "Укажите количество участников.",
        });
      }
    }
  });

export type TravelerRequest = z.infer<typeof travelerRequestSchema>;
