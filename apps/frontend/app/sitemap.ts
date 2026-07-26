import type { MetadataRoute } from "next";

// Bump when page content meaningfully changes; a request-time date would make
// every crawl look like fresh content and erode trust in the sitemap.
const lastContentChange = new Date("2026-07-26");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://pubgolf.me",
      lastModified: lastContentChange,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://pubgolf.me/how-to-play",
      lastModified: lastContentChange,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://pubgolf.me/terms",
      lastModified: lastContentChange,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: "https://pubgolf.me/privacy",
      lastModified: lastContentChange,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
