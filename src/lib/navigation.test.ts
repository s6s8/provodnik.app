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

// Item 7: the public catalog existed but had no way in — no nav entry, and the
// route redirected. The entry must appear when FEATURE_PUBLIC_CATALOG is on and
// hide itself when it is off, so the flag is the single switch.
describe("public catalog nav entry (item 7)", () => {
  it("offers the catalog to anonymous visitors and travelers", () => {
    for (const nav of [publicPrimaryNav, travelerPrimaryNav]) {
      expect(nav.map((i) => i.href)).toContain("/listings");
    }
  });

  it("is gated on FEATURE_PUBLIC_CATALOG", () => {
    expect(NAV_FLAG_BY_HREF["/listings"]).toBe("FEATURE_PUBLIC_CATALOG");
  });

  it("disappears from the header when the flag is off", () => {
    const hidden = hiddenNavHrefsForFlags((flag) => flag !== "FEATURE_PUBLIC_CATALOG");
    expect(hidden).toContain("/listings");

    const visible = filterNavItemsByHiddenHrefs(publicPrimaryNav, hidden);
    expect(visible.map((i) => i.href)).not.toContain("/listings");
    // …and the rest of the nav survives.
    expect(visible.map((i) => i.href)).toContain("/requests");
  });

  it("is labelled distinctly from the guide's own «Экскурсии» workspace tab", () => {
    const entry = publicPrimaryNav.find((i) => i.href === "/listings");
    expect(entry?.label).toBe("Готовые экскурсии");
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
    expect(mobileBottomNavByRole.traveler).toBe(travelerPrimaryNav);
  });

  it("exposes the full admin workspace as the admin primary nav", () => {
    expect(adminPrimaryNav.map((item) => item.href)).toEqual([
      "/admin/dashboard",
      "/admin/analytics",
      "/admin/users",
      "/admin/guides",
      "/admin/moderation",
      "/admin/locations",
      "/admin/pipeline",
      "/admin/disputes",
      "/admin/bookings",
      "/admin/audit",
    ]);
  });

  it("keeps the traveler primary nav focused on marketplace + trips", () => {
    // Item 7 reverses the earlier "hide the catalog" call: /listings is back, now
    // gated on FEATURE_PUBLIC_CATALOG (see "public catalog nav entry" above).
    expect(travelerPrimaryNav.map((item) => item.href)).toEqual([
      "/requests",
      "/listings",
      "/guides",
      "/trips",
    ]);
    // T-39: the traveler cabinet holds REQUESTS, not trips — one vocabulary
    // across nav, cabinet CTAs and empty states.
    expect(travelerPrimaryNav.map((item) => item.label)).toEqual([
      "Запросы",
      "Готовые экскурсии",
      "Гиды",
      "Мои запросы",
    ]);
  });

  it("keeps /destinations out of every non-workspace nav", () => {
    // Item 7 re-exposed /listings, but /destinations stays out: the same flag
    // guards its route, and it has no curated inventory yet.
    //
    // The bare label «Экскурсии» must ALSO stay out of these navs — it is the
    // guide's own workspace tab (ROUTES.guideListings). The public catalog is
    // «Готовые экскурсии» precisely so the two never read as the same thing.
    for (const nav of [publicPrimaryNav, travelerPrimaryNav, adminHeaderNav]) {
      const hrefs = nav.map((item) => item.href);
      const labels = nav.map((item) => item.label);
      expect(hrefs).not.toContain("/destinations");
      expect(labels).not.toContain("Направления");
      expect(labels).not.toContain("Экскурсии");
    }

    // The footer must not link /destinations either — it has no flag-aware
    // filtering of its own, so an entry there would 404 whenever the flag is off.
    const footerHrefs = [
      ...footerNav.about,
      ...footerNav.support,
      ...footerNav.legal,
    ].map((item) => item.href);
    expect(footerHrefs).not.toContain("/destinations");
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
