import { z } from "zod";

import { THEMES, type ThemeSlug } from "@/data/themes";
import {
  DESTINATION_MAX_LENGTH,
  DESTINATION_MIN_LENGTH,
  isSupportedDestinationLabel,
  sanitizeTravelerRequestDestinationLabel,
} from "@/lib/traveler-request-destination";

export const travelerRequestModes = ["assembly", "private"] as const;

/** Authoritative ceiling for travelers on one request (D21-2). Mirrored in the
 * database by the `enforce_traveler_request_participants_max` trigger. */
export const MAX_REQUEST_PARTICIPANTS = 50;
export const MAX_REQUEST_PARTICIPANTS_MESSAGE = `Максимум ${MAX_REQUEST_PARTICIPANTS} путешественников.`;

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
          .min(DESTINATION_MIN_LENGTH, "Укажите город или направление.")
          .max(DESTINATION_MAX_LENGTH, "Не больше 80 символов.")
          .refine(isSupportedDestinationLabel, {
            message: "Укажите название места буквами, например «Казань» или «Шанхай».",
          }),
      ),
    startDate: z.string().min(1, "Укажите дату начала."),
    endDate: z.string().optional().or(z.literal("")),
    dateFlexibility: z.enum(["exact", "few_days"]).default("exact"),
    startTime: z.string().optional().or(z.literal("")),
    endTime: z.string().optional().or(z.literal("")),
    // assembly mode counters
    groupSizeCurrent: z
      .number()
      .int("Укажите целое число.")
      .min(1, "Минимум 1 путешественник.")
      .max(MAX_REQUEST_PARTICIPANTS, MAX_REQUEST_PARTICIPANTS_MESSAGE)
      .optional(),
    // private mode counter
    groupSize: z
      .number()
      .int("Укажите целое число.")
      .min(1, "Минимум 1 путешественник.")
      .max(MAX_REQUEST_PARTICIPANTS, MAX_REQUEST_PARTICIPANTS_MESSAGE)
      .optional(),
    allowGuideSuggestionsOutsideConstraints: z.boolean(),
    openToJoin: z.boolean().optional(),
    budgetPerPersonRub: z
      // `{ error }` supplies the invalid-type message (e.g. NaN from a non-numeric
      // "abc" entry via valueAsNumber) — the raw "expected number, received NaN"
      // leaked to Russian users otherwise. The per-check messages below still win
      // for int/min/max.
      .number({ error: "Укажите бюджет числом, например 5000." })
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
    // Ready excursion the request started from («Отправить запрос гиду» on /excursions/:id).
    // A derivation source only — the database re-reads the template and owns the snapshot.
    guideTemplateId: z.uuid("Некорректная экскурсия.").optional(),
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

    if (value.dateFlexibility === "exact") {
      if (!value.startTime?.trim() || !timeRegex.test(value.startTime)) {
        ctx.addIssue({
          code: "custom",
          path: ["startTime"],
          message: "Укажите время начала (ЧЧ:ММ).",
        });
      }
      if (!value.endTime?.trim() || !timeRegex.test(value.endTime)) {
        ctx.addIssue({
          code: "custom",
          path: ["endTime"],
          message: "Укажите время окончания (ЧЧ:ММ).",
        });
      }
    }
  });

type TravelerRequestReadFields = {
  groupMax?: number;
};

export type TravelerRequest = z.infer<typeof travelerRequestSchema> & TravelerRequestReadFields;
export type TravelerRequestInput = z.input<typeof travelerRequestSchema>;
