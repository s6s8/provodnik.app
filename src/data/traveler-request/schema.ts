import { z } from "zod";

import { THEMES, type ThemeSlug } from "@/data/themes";
import { sanitizeTravelerRequestDestinationLabel } from "@/lib/traveler-request-destination";

export const travelerRequestModes = ["assembly", "private"] as const;

const timeRegex = /^\d{2}:\d{2}$/;

export const travelerRequestSchema = z
  .object({
    mode: z.enum(travelerRequestModes),
    interests: z
      .array(
        z.enum(THEMES.map((t) => t.slug) as [ThemeSlug, ...ThemeSlug[]]),
      )
      .min(1, { message: "Выберите хотя бы одну категорию." }),
    requestedLanguages: z.array(z.string()).default([]),
    destination: z
      .string()
      .transform((value) =>
        sanitizeTravelerRequestDestinationLabel(value, { fallback: false }),
      )
      .pipe(
        z
          .string()
          .min(2, "Укажите город или направление.")
          .max(80, "Не больше 80 символов."),
      ),
    startDate: z.string().min(1, "Укажите дату начала."),
    endDate: z.string().optional().or(z.literal("")),
    dateFlexibility: z.enum(["exact", "few_days"]).default("exact"),
    startTime: z.string().regex(timeRegex, "Укажите время начала (ЧЧ:ММ)."),
    endTime: z.string().regex(timeRegex, "Укажите время окончания (ЧЧ:ММ)."),
    // assembly mode counters
    groupSizeCurrent: z
      .number()
      .int("Укажите целое число.")
      .min(1, "Минимум 1 путешественник.")
      .max(20, "Максимум 20 путешественников.")
      .optional(),
    // private mode counter
    groupSize: z
      .number()
      .int("Укажите целое число.")
      .min(1, "Минимум 1 путешественник.")
      .max(20, "Максимум 20 путешественников.")
      .optional(),
    allowGuideSuggestionsOutsideConstraints: z.boolean(),
    openToJoin: z.boolean().optional(),
    budgetPerPersonRub: z
      .number()
      .int("Укажите целое число.")
      .min(1_000, "Бюджет должен быть не меньше 1 000 ₽.")
      .max(2_000_000, "Бюджет выглядит слишком высоким.")
      .optional()
      .transform((value) => value as number),
    notes: z
      .string()
      .trim()
      .max(800, "Не больше 800 символов.")
      .optional()
      .or(z.literal("")),
    // Guide preselected via "Запросить этого гида" (guide public page CTA).
    preferredGuideSlug: z
      .string()
      .trim()
      .max(120)
      .regex(/^\S+$/, "Некорректный идентификатор гида.")
      .optional(),
  })
  .superRefine((value, ctx) => {
    const start = new Date(value.startDate);

    if (Number.isNaN(start.getTime())) {
      ctx.addIssue({
        code: "custom",
        path: ["startDate"],
        message: "Дата начала указана неверно.",
      });
    }

    if (value.endDate && value.endDate < value.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "Дата окончания не может быть раньше даты начала.",
      });
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

type TravelerRequestReadFields = {
  groupMax?: number;
};

export type TravelerRequest = z.infer<typeof travelerRequestSchema> & TravelerRequestReadFields;
export type TravelerRequestInput = z.input<typeof travelerRequestSchema>;
