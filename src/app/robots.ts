import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/traveler/", "/guide/"],
    },
    sitemap: "https://provodnik.app/sitemap.xml",
  };
}
