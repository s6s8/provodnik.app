import { z } from "zod";

const envFlag = z.enum(["0", "1"]).catch("0");

const flagsSchema = z.object({
  FEATURE_TR_TOURS: envFlag,
  FEATURE_TR_NOTIFICATIONS: envFlag,
  FEATURE_TR_PAYMENT: envFlag,
  FEATURE_TR_FAVORITES: envFlag,
  FEATURE_TR_PARTNER: envFlag,
  FEATURE_TR_REFERRALS: envFlag,
  FEATURE_TR_DISPUTES: envFlag,
  // Public excursions/destinations catalog. Hidden per Wildberries review:
  // /listings & /destinations are inaccessible (404) unless this is set to "1".
  FEATURE_PUBLIC_CATALOG: envFlag,
});

const env = (k: string): string | undefined =>
  typeof process !== "undefined" ? process.env[k] : undefined;

const rawFlags = {
  FEATURE_TR_TOURS: env("FEATURE_TR_TOURS"),
  FEATURE_TR_NOTIFICATIONS: env("FEATURE_TR_NOTIFICATIONS"),
  FEATURE_TR_PAYMENT: env("FEATURE_TR_PAYMENT"),
  FEATURE_TR_FAVORITES: env("FEATURE_TR_FAVORITES"),
  FEATURE_TR_PARTNER: env("FEATURE_TR_PARTNER"),
  FEATURE_TR_REFERRALS: env("FEATURE_TR_REFERRALS"),
  FEATURE_TR_DISPUTES: env("FEATURE_TR_DISPUTES"),
  FEATURE_PUBLIC_CATALOG: env("FEATURE_PUBLIC_CATALOG"),
};

const parsed = flagsSchema.parse(rawFlags);

export const flags = {
  FEATURE_TR_TOURS: parsed.FEATURE_TR_TOURS === "1",
  FEATURE_TR_NOTIFICATIONS: parsed.FEATURE_TR_NOTIFICATIONS === "1",
  FEATURE_TR_PAYMENT: parsed.FEATURE_TR_PAYMENT === "1",
  FEATURE_TR_FAVORITES: parsed.FEATURE_TR_FAVORITES === "1",
  FEATURE_TR_PARTNER: parsed.FEATURE_TR_PARTNER === "1",
  FEATURE_TR_REFERRALS: parsed.FEATURE_TR_REFERRALS === "1",
  FEATURE_TR_DISPUTES: parsed.FEATURE_TR_DISPUTES === "1",
  FEATURE_PUBLIC_CATALOG: parsed.FEATURE_PUBLIC_CATALOG === "1",
} as const;

export type FlagName = keyof typeof flags;
export const isEnabled = (k: FlagName): boolean => flags[k];
