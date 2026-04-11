import { z } from "zod";

export const reviewReplySchema = z.object({
  review_id: z.string().uuid(),
  guide_id: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
  status: z.enum(["draft", "pending_review", "published"]).default("draft"),
});

export type ReviewReplyInput = z.infer<typeof reviewReplySchema>;
