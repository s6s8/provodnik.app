import { describe, it, expect } from "vitest";
import { flags, isEnabled, type FlagName } from "./flags";

describe("flags registry", () => {
  it("exposes every registered sub-flag with the intended default contract", () => {
    const subs: FlagName[] = [
      "FEATURE_TR_TOURS",
      "FEATURE_TR_NOTIFICATIONS",
      "FEATURE_TR_PAYMENT",
      "FEATURE_TR_FAVORITES",
      "FEATURE_TR_PARTNER",
      "FEATURE_TR_REFERRALS",
      "FEATURE_TR_DISPUTES",
      "FEATURE_PUBLIC_CATALOG",
    ];
    const defaultOn: FlagName[] = [
      "FEATURE_TR_NOTIFICATIONS",
      "FEATURE_PUBLIC_CATALOG",
    ];
    expect(subs).toEqual(Object.keys(flags));
    for (const k of subs) {
      expect(k in flags).toBe(true);
      if (defaultOn.includes(k)) {
        expect(isEnabled(k)).toBe(true);
      } else {
        expect(isEnabled(k)).toBe(false);
      }
    }
  });

  it("isEnabled returns the flag value", () => {
    expect(isEnabled("FEATURE_TR_TOURS")).toBe(false);
  });
});
