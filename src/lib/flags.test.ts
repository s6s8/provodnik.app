import { describe, it, expect } from "vitest";
import { flags, isEnabled, type FlagName } from "./flags";

describe("flags registry", () => {
  it("exposes all 12 sub-flags", () => {
    const subs: FlagName[] = [
      "FEATURE_TR_TOURS",
      "FEATURE_TR_KPI",
      "FEATURE_TR_NOTIFICATIONS",
      "FEATURE_TR_REPUTATION",
      "FEATURE_TR_PERIPHERALS",
      "FEATURE_TR_HELP",
      "FEATURE_TR_FAVORITES",
      "FEATURE_TR_PARTNER",
      "FEATURE_TR_REFERRALS",
      "FEATURE_TR_QUIZ",
      "FEATURE_TR_DISPUTES",
      "FEATURE_DEPOSITS",
    ];
    for (const k of subs) {
      expect(k in flags).toBe(true);
      expect(isEnabled(k)).toBe(false);
    }
  });

  it("isEnabled returns the flag value", () => {
    expect(isEnabled("FEATURE_TR_TOURS")).toBe(false);
  });
});
