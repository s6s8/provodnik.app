import { z } from "zod";

import {
  MAX_REQUEST_PARTICIPANTS,
  MAX_REQUEST_PARTICIPANTS_MESSAGE,
} from "@/data/traveler-request/schema";

export const submitRequestSchema = z.object({
  listingId: z.uuid(),
  guideId: z.uuid(),
  destination: z.string().trim().min(1).max(255),
  region: z.string().trim().min(1).max(255),
  category: z.string().trim().min(1).max(100),
  startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endsOn: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")]).optional(),
  participantsCount: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_REQUEST_PARTICIPANTS, MAX_REQUEST_PARTICIPANTS_MESSAGE),
  formatPreference: z.string().max(50).optional(),
  notes: z.string().trim().max(2000).optional(),
  mode: z.enum(["order", "question"]).optional(),
});

export type SubmitRequestInput = z.infer<typeof submitRequestSchema>;
