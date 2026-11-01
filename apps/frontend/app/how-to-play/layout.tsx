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
};

export default function HowToPlayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
