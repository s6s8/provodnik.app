import { describe, expect, it } from "vitest";

import {
  adminAccountMenu,
  adminHeaderNav,
  adminPrimaryNav,
  filterNavItemsByHiddenHrefs,
  footerNav,
  guideAccountMenu,
  guidePrimaryNav,
  hiddenNavHrefsForFlags,
  mobileBottomNavByRole,
  NAV_FLAG_BY_HREF,
  publicPrimaryNav,
  travelerAccountMenu,
  travelerPrimaryNav,
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
    const filtered = filterNavItemsByHiddenHrefs(travelerAccountMenu, hidden);
    const hrefs = filtered.map((item) => item.href);
    expect(hrefs).not.toContain("/favorites");
    expect(hrefs).not.toContain("/referrals");
    // Non-gated links stay.
    expect(hrefs).toContain("/account");
  });

  it("keeps the help link visible — /help is a core, always-on page", () => {
    // /help renders a real help center (FAQ + support), so it is no longer
    // feature-gated and must never be hidden from nav/footer surfaces.
    expect(Object.keys(NAV_FLAG_BY_HREF)).not.toContain("/help");

    const hidden = hiddenNavHrefsForFlags(() => false);
    const supportLinks = filterNavItemsByHiddenHrefs(footerNav.support, hidden);
    expect(supportLinks.some((item) => item.href === "/help")).toBe(true);

    const travelerLinks = filterNavItemsByHiddenHrefs(travelerAccountMenu, hidden);
    expect(travelerLinks.some((item) => item.href === "/help")).toBe(true);
  });

  it("returns a copy when nothing is hidden", () => {
    const filtered = filterNavItemsByHiddenHrefs(adminAccountMenu, []);
    expect(filtered).toEqual([...adminAccountMenu]);
  });
});

describe("role-based nav groups", () => {
  it("keeps account menus free of primary-nav duplicates", () => {
    // «Уведомления» (bell owns it) and «Поездки» (top nav owns trips) must not
    // appear in the traveler avatar menu.
    const travelerHrefs = travelerAccountMenu.map((item) => item.href);
    expect(travelerHrefs).not.toContain("/notifications");
    expect(travelerHrefs).not.toContain("/bookings");
    expect(travelerHrefs).toEqual(["/account", "/help"]);

    // Guide workspace items belong in the primary nav, not the avatar menu.
    const guideHrefs = guideAccountMenu.map((item) => item.href);
    expect(guideHrefs).not.toContain("/guide/inbox");
    expect(guideHrefs).not.toContain("/guide/listings");
    expect(guideHrefs).not.toContain("/guide/bookings");
    expect(guideHrefs).not.toContain("/guide/reviews");

    // Admin avatar holds only private utilities — no workspace links.
    const adminHrefs = adminAccountMenu.map((item) => item.href);
    expect(adminHrefs).toEqual(["/account", "/help"]);
    expect(adminHrefs.some((href) => href.startsWith("/admin"))).toBe(false);
  });

  it("keeps Favorites/Referrals out of the traveler avatar menu", () => {
    // Excel review: these flag-gated side surfaces read as "зачем эта страница?"
    // in the avatar menu; they stay reachable by route but no longer clutter it.
    const travelerHrefs = travelerAccountMenu.map((item) => item.href);
    expect(travelerHrefs).not.toContain("/favorites");
    expect(travelerHrefs).not.toContain("/referrals");
  });

  it("labels the guide profile entry «Профиль гида» in the avatar menu", () => {
    const profile = guideAccountMenu.find((item) => item.href === "/guide/profile");
    expect(profile?.label).toBe("Профиль гида");
  });

  it("points the guide primary nav at the canonical inbox route", () => {
    expect(guidePrimaryNav[0].href).toBe("/guide/inbox");
  });

  it("drives the guide mobile bottom nav from the guide primary nav", () => {
    expect(mobileBottomNavByRole.guide).toBe(guidePrimaryNav);
    expect(mobileBottomNavByRole.admin).toBe(adminPrimaryNav);
  });

  it("exposes the full admin workspace as the admin primary nav", () => {
    expect(adminPrimaryNav.map((item) => item.href)).toEqual([
      "/admin/dashboard",
      "/admin/users",
      "/admin/guides",
      "/admin/moderation",
      "/admin/pipeline",
      "/admin/disputes",
      "/admin/bookings",
      "/admin/audit",
    ]);
  });

  it("keeps the traveler primary nav focused on marketplace + trips", () => {
    // The public catalog surfaces (/listings «Экскурсии», /destinations
    // «Направления») are hidden per the Wildberries review, so discovery flows
    // through requests + guides instead.
    expect(travelerPrimaryNav.map((item) => item.href)).toEqual([
      "/requests",
      "/guides",
      "/trips",
    ]);
    expect(travelerPrimaryNav.map((item) => item.label)).toEqual([
      "Запросы",
      "Гиды",
      "Мои поездки",
    ]);
  });

  it("hides the public catalog surfaces from every non-workspace nav", () => {
    // Wildberries review: «Экскурсии» (/listings) and «Направления»
    // (/destinations) must not surface in public/traveler/admin-header nav —
    // no href and no label. Guide/admin *workspace* listing management keeps its
    // own internal «Экскурсии»/«Листинги» labels and is intentionally excluded.
    const HIDDEN_HREFS = ["/listings", "/destinations"];
    const HIDDEN_LABELS = ["Экскурсии", "Направления"];

    for (const nav of [publicPrimaryNav, travelerPrimaryNav, adminHeaderNav]) {
      const hrefs = nav.map((item) => item.href);
      const labels = nav.map((item) => item.label);
      for (const href of HIDDEN_HREFS) expect(hrefs).not.toContain(href);
      for (const label of HIDDEN_LABELS) expect(labels).not.toContain(label);
    }

    // Footer legal/support/about groups must not link the hidden catalog either.
    const footerHrefs = [
      ...footerNav.about,
      ...footerNav.support,
      ...footerNav.legal,
    ].map((item) => item.href);
    for (const href of HIDDEN_HREFS) expect(footerHrefs).not.toContain(href);
  });

  it("uses the simplified guide workspace labels", () => {
    expect(guidePrimaryNav.map((item) => item.label)).toEqual([
      "Запросы",
      "Мои бронирования",
      "Экскурсии",
      "Отзывы",
    ]);
  });

  it("keeps guide requests and bookings next to each other", () => {
    expect(guidePrimaryNav.map((item) => item.href)).toEqual([
      "/guide/inbox",
      "/guide/bookings",
      "/guide/listings",
      "/guide/reviews",
    ]);
  });
});
