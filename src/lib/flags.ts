const env = (k: string, d = "0"): string =>
  typeof process !== "undefined" && process.env[k] !== undefined ? (process.env[k] as string) : d;

const bool = (k: string): boolean => env(k, "0") === "1";

export const flags = {
  FEATURE_TR_TOURS: bool("FEATURE_TR_TOURS"),
  FEATURE_TR_KPI: bool("FEATURE_TR_KPI"),
  FEATURE_TR_NOTIFICATIONS: bool("FEATURE_TR_NOTIFICATIONS"),
  FEATURE_TR_REPUTATION: bool("FEATURE_TR_REPUTATION"),
  FEATURE_TR_PERIPHERALS: bool("FEATURE_TR_PERIPHERALS"),
  FEATURE_TR_HELP: bool("FEATURE_TR_HELP"),
  FEATURE_TR_PAYMENT: bool("FEATURE_TR_PAYMENT"),
  FEATURE_TR_FAVORITES: bool("FEATURE_TR_FAVORITES"),
  FEATURE_TR_PARTNER: bool("FEATURE_TR_PARTNER"),
  FEATURE_TR_REFERRALS: bool("FEATURE_TR_REFERRALS"),
  FEATURE_TR_QUIZ: bool("FEATURE_TR_QUIZ"),
  FEATURE_TR_DISPUTES: bool("FEATURE_TR_DISPUTES"),
  FEATURE_DEPOSITS: bool("FEATURE_DEPOSITS"),
} as const;

export type FlagName = keyof typeof flags;
export const isEnabled = (k: FlagName): boolean => flags[k];
