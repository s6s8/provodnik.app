import { z } from "zod";

export const travelerExperienceTypes = [
  "city",
  "nature",
  "culture",
  "food",
  "adventure",
  "relax",
] as const;

export const travelerGroupPreferences = ["private", "group"] as const;

export const travelerRequestSchema = z
  .object({
    experienceType: z.enum(travelerExperienceTypes),
    destination: z
      .string()
      .trim()
      .min(2, "Tell us where you want to go.")
      .max(80, "Keep it under 80 characters."),
    startDate: z.string().min(1, "Pick a start date."),
    endDate: z.string().min(1, "Pick an end date."),
    groupSize: z
      .number()
      .int("Use a whole number.")
      .min(1, "Minimum 1 traveler.")
      .max(20, "For MVP, cap group size at 20."),
    groupPreference: z.enum(travelerGroupPreferences),
    openToJoiningOthers: z.boolean(),
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
    const end = new Date(value.endDate);

    if (Number.isNaN(start.getTime())) {
      ctx.addIssue({
        code: "custom",
        path: ["startDate"],
        message: "Start date is not valid.",
      });
    }

    if (Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date is not valid.",
      });
    }

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      if (end.getTime() < start.getTime()) {
        ctx.addIssue({
          code: "custom",
          path: ["endDate"],
          message: "End date must be on or after the start date.",
        });
      }
    }

    if (value.groupPreference === "private" && value.openToJoiningOthers) {
      ctx.addIssue({
        code: "custom",
        path: ["openToJoiningOthers"],
        message: "Private requests cannot be open to joining others.",
      });
    }
  });

export type TravelerRequest = z.infer<typeof travelerRequestSchema>;
