import { z } from "zod";

export const personalSettingsSchema = z.object({
  locale: z.string().trim().min(1).max(10),
  preferredCurrency: z.string().trim().min(1).max(10),
  // Notification prefs are flexible but must stay flat for DB JSON safety.
  notificationPrefs: z.record(
    z.string(),
    z.union([z.boolean(), z.string(), z.number()]),
  ),
});

export type PersonalSettingsInput = z.infer<typeof personalSettingsSchema>;
