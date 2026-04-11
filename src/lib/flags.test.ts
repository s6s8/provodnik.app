import { describe, it, expect } from "vitest";
import { flags, isEnabled, type FlagName } from "./flags";

describe("flags registry", () => {
  it("FEATURE_TRIPSTER_V1 defaults to false", () => {
    expect(flags.FEATURE_TRIPSTER_V1).toBe(false);
  });

  it("exposes all 12 sub-flags", () => {
    const subs: FlagName[] = [
      "FEATURE_TRIPSTER_TOURS",
      "FEATURE_TRIPSTER_KPI",
      "FEATURE_TRIPSTER_NOTIFICATIONS",
      "FEATURE_TRIPSTER_REPUTATION",
      "FEATURE_TRIPSTER_PERIPHERALS",
      "FEATURE_TRIPSTER_HELP",
      "FEATURE_TRIPSTER_FAVORITES",
      "FEATURE_TRIPSTER_PARTNER",
      "FEATURE_TRIPSTER_REFERRALS",
      "FEATURE_TRIPSTER_QUIZ",
      "FEATURE_TRIPSTER_DISPUTES",
      "FEATURE_DEPOSITS",
    ];
    for (const k of subs) {
      expect(k in flags).toBe(true);
      expect(isEnabled(k)).toBe(false);
    }
  });

  it("isEnabled returns the flag value", () => {
    expect(isEnabled("FEATURE_TRIPSTER_V1")).toBe(false);
  });
});
