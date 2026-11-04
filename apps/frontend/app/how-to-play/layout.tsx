import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "How to Play Pub Golf — Rules, Scoring & Penalties",
  },
  description:
    "The complete pub golf rules: how scoring works, what to drink at each hole, penalties, and the course. Learn how to play, then host a free round for your pub crawl.",
  alternates: {
    canonical: "/how-to-play",
  },
  openGraph: {
    title: "How to Play Pub Golf — Rules, Scoring & Penalties",
    description:
      "Learn pub golf rules, scoring, penalties, and how to plan a nine-hole course.",
    url: "https://pubgolf.me/how-to-play",
    siteName: "Pub Golf",
    type: "website",
    locale: "en_GB",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Play Pub Golf — Rules, Scoring & Penalties",
    description:
      "Learn pub golf rules, scoring, penalties, and how to plan a nine-hole course.",
    images: ["/opengraph-image"],
  },
};

export default function HowToPlayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
