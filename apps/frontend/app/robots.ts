import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // In-game screens are per-round and meaningless outside a session;
      // keep crawlers on the marketing pages.
      disallow: ["/game", "/submit-score", "/randomise"],
    },
    sitemap: "https://pubgolf.me/sitemap.xml",
  };
}
