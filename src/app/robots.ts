import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/guide/", "/trips", "/account", "/bookings/"],
    },
    sitemap: "https://provodnik.app/sitemap.xml",
  };
}
