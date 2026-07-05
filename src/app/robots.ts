import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Scope the guide-cabinet disallows to specific sections instead of the
      // whole /guide/ prefix, so the legacy /guide/[id] → /guides/[slug] redirect
      // stays crawlable (PRD-031/PRD-026).
      disallow: [
        "/admin/",
        "/api/",
        "/guide/bookings",
        "/guide/calendar",
        "/guide/inbox",
        "/guide/listings",
        "/guide/profile",
        "/guide/reviews",
        "/guide/settings",
        "/guide/stats",
        "/trips",
        "/account",
        "/bookings/",
      ],
    },
    sitemap: "https://provodnik.app/sitemap.xml",
  };
}
