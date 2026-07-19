import { z } from "zod";

import { kopecksToRub, rubToKopecks } from "@/data/money";

// A guide may only ever leave a ready tour as a draft or submit it for review.
// Publishing/rejecting is admin-only (enforced again at the server helper and the DB).
const templateStatusSchema = z.enum(["draft", "pending_review"]);

const nullableTrimmedStringSchema = z.string().transform((value) => value.trim() || null);

const priceFromRubSchema = z.string().transform((value, ctx) => {
  const rawPrice = value.trim();
  const priceFromRub = rawPrice ? Number(rawPrice) : Number.NaN;
  if (!Number.isFinite(priceFromRub) || priceFromRub <= 0) {
    ctx.addIssue({
      code: "custom",
      message: "Укажите корректную положительную цену.",
    });
    return z.NEVER;
  }

  return kopecksToRub(rubToKopecks(priceFromRub));
});

const maxParticipantsSchema = z.string().transform((value, ctx) => {
  const rawParticipants = value.trim();
  if (!rawParticipants) return null;

  const maxParticipants = Number(rawParticipants);
  if (
    !Number.isInteger(maxParticipants) ||
    maxParticipants < 1 ||
    maxParticipants > 500
  ) {
    ctx.addIssue({
      code: "custom",
      message: "Укажите корректное число участников.",
    });
    return z.NEVER;
  }

  return maxParticipants;
});

export const excursionFormSchema = z
  .object({
    title: z.string().transform((value, ctx) => {
      const title = value.trim();
      if (!title) {
        ctx.addIssue({
          code: "custom",
          message: "Название обязательно.",
        });
        return z.NEVER;
      }

      return title;
    }),
    description: nullableTrimmedStringSchema,
    duration: nullableTrimmedStringSchema,
    priceRub: priceFromRubSchema,
    status: templateStatusSchema,
    meetingPoint: nullableTrimmedStringSchema,
    maxParticipants: maxParticipantsSchema,
    photoUrls: z.array(z.string()),
    region: nullableTrimmedStringSchema,
    category: nullableTrimmedStringSchema,
  })
  .superRefine((values, ctx) => {
    if (values.status === "pending_review" && values.photoUrls.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["photoUrls"],
        message: "Добавьте минимум одно фото перед отправкой на проверку.",
      });
    }
  });

export const defaultExcursionFormValues: ExcursionFormInput = {
  title: "",
  description: "",
  duration: "",
  priceRub: "",
  status: "draft",
  meetingPoint: "",
  maxParticipants: "",
  photoUrls: [],
  region: "",
  category: "",
};

export type ExcursionFormInput = z.input<typeof excursionFormSchema>;
export type ExcursionFormValues = z.output<typeof excursionFormSchema>;
