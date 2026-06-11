import { z } from "zod";

export const onboardingStepSchema = z.coerce.number().int().min(0).max(50);
export const onboardingRegionsSchema = z.array(z.string().trim().min(1)).max(20);
