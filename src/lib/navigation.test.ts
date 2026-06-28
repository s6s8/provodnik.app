import { describe, expect, it } from "vitest";

import {
  accountMenu,
  filterNavItemsByHiddenHrefs,
  footerNav,
  hiddenNavHrefsForFlags,
  NAV_FLAG_BY_HREF,
} from "@/lib/navigation";

describe("hiddenNavHrefsForFlags", () => {
  it("hides every flag-gated href when all flags are off", () => {
    const hidden = hiddenNavHrefsForFlags(() => false);
    expect(hidden.sort()).toEqual(Object.keys(NAV_FLAG_BY_HREF).sort());
  });

  it("hides nothing when all flags are on", () => {
    expect(hiddenNavHrefsForFlags(() => true)).toEqual([]);
  });

  it("only hides the href whose flag is off", () => {
    const hidden = hiddenNavHrefsForFlags((flag) => flag !== "FEATURE_TR_FAVORITES");
    expect(hidden).toEqual(["/favorites"]);
  });
});

describe("filterNavItemsByHiddenHrefs", () => {
  it("removes gated traveler menu links when their flags are off", () => {
    const hidden = hiddenNavHrefsForFlags(() => false);
    const filtered = filterNavItemsByHiddenHrefs(accountMenu.traveler, hidden);
    const hrefs = filtered.map((item) => item.href);
    expect(hrefs).not.toContain("/favorites");
    expect(hrefs).not.toContain("/referrals");
    expect(hrefs).not.toContain("/help");
    // Non-gated links stay.
    expect(hrefs).toContain("/account");
    expect(hrefs).toContain("/notifications");
  });

  it("drops the footer help link when FEATURE_TR_HELP is off", () => {
    const hidden = hiddenNavHrefsForFlags((flag) => flag !== "FEATURE_TR_HELP");
    const filtered = filterNavItemsByHiddenHrefs(footerNav.support, hidden);
    expect(filtered.some((item) => item.href === "/help")).toBe(false);
    // External support channels are untouched.
    expect(filtered.some((item) => item.href.startsWith("https://t.me/"))).toBe(true);
  });

  it("returns a copy when nothing is hidden", () => {
    const filtered = filterNavItemsByHiddenHrefs(accountMenu.admin, []);
    expect(filtered).toEqual([...accountMenu.admin]);
  });
});
