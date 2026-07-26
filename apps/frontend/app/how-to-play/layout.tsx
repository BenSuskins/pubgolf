import type { Metadata } from "next";
import { FREQUENTLY_ASKED_QUESTIONS } from "./faq";

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

// Static, compile-time FAQ content; "<" is escaped as recommended for JSON-LD
// so the payload can never terminate the script element early.
const faqJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FREQUENTLY_ASKED_QUESTIONS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
}).replace(/</g, "\\u003c");

export default function HowToPlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: faqJsonLd }}
      />
      {children}
    </>
  );
}
