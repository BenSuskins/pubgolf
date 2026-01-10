import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Play Pub Golf - Rules & Scoring",
  description:
    "Learn the rules of Pub Golf. 9 holes, 9 drinks, beat the par at each stop. Complete guide to scoring, penalties, and the drink course.",
};

export default function HowToPlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
