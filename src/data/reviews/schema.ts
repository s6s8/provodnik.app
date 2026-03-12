import { z } from "zod";

export const reviewTargetTypeSchema = z.enum(["guide", "listing"]);

export const reviewRatingSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export const reviewSubmissionSchema = z.object({
  targetType: reviewTargetTypeSchema,
  targetSlug: z.string().min(1),
  rating: reviewRatingSchema,
  title: z.string().min(3).max(80),
  body: z.string().min(20).max(900),
  tags: z
    .array(z.string().min(1).max(24))
    .max(6)
    .optional(),
});

export type ReviewSubmission = z.infer<typeof reviewSubmissionSchema>;

