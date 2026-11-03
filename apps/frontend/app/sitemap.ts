import type { MetadataRoute } from "next";

// Bump when page content meaningfully changes; a request-time date would make
// every crawl look like fresh content and erode trust in the sitemap.
const guideContentChange = new Date("2026-11-03");
const legalContentChange = new Date("2026-11-01");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://pubgolf.me",
      lastModified: guideContentChange,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://pubgolf.me/how-to-play",
      lastModified: guideContentChange,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://pubgolf.me/terms",
      lastModified: legalContentChange,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: "https://pubgolf.me/privacy",
      lastModified: legalContentChange,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
