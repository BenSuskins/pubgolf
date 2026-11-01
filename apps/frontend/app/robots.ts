import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Crawlers must reach game pages to read their noindex metadata.
    },
    sitemap: "https://pubgolf.me/sitemap.xml",
  };
}
