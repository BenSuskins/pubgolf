import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { GolfBallLogo } from '@/components/GolfBallLogo';
import { HomeGameEntry } from '@/components/HomeGameEntry';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

function GameEntryFallback() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading game options">
      <div className="h-11 rounded-[14px] bg-[var(--color-border)] animate-pulse" />
      <div className="h-64 rounded-2xl bg-[var(--color-border)] animate-pulse" />
    </div>
  );
}

export default function HomePage() {
  return (
    <section className="min-h-full flex flex-col items-center justify-start bg-ambient p-6 pb-12">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center pt-6">
          <GolfBallLogo size={72} className="mx-auto mb-4" />
          <h1 className="font-display text-[52px] leading-[0.95] text-[var(--color-text)]">
            PUB
            <br />
            GOLF
          </h1>
          <div className="flex items-center justify-center gap-2.5 mt-3.5">
            <span className="h-px w-7 bg-[var(--color-border-subtle)]" aria-hidden="true" />
            <p className="eyebrow text-[var(--color-text-secondary)]">
              9 Holes · 9 Drinks · 1 Champion
            </p>
            <span className="h-px w-7 bg-[var(--color-border-subtle)]" aria-hidden="true" />
          </div>
        </div>

        <Suspense fallback={<GameEntryFallback />}>
          <HomeGameEntry />
        </Suspense>

        <div className="text-center">
          <Link
            href="/how-to-play"
            className="text-[13px] text-[var(--color-text-muted)] border-b border-dashed border-[var(--color-border-subtle)] pb-0.5 hover:text-[var(--color-text-secondary)] transition-colors"
          >
            First time? Learn the rules
          </Link>
        </div>

        <section className="pt-8 space-y-6 text-center">
          <div>
            <h2 className="text-[var(--color-text)] font-bold text-[15px] mb-2">
              What is Pub Golf?
            </h2>
            <p className="text-[13.5px] leading-relaxed text-[var(--color-text-secondary)]">
              Pub golf is a drinking game played like a round of golf across your favourite
              pubs. Each pub is a hole with a set drink and a par — finish your drink in
              fewer sips than par to go under. Lowest score at the end of the crawl wins.
            </p>
          </div>

          <div>
            <h2 className="text-[var(--color-text)] font-bold text-[15px] mb-2">
              A free pub golf score tracker
            </h2>
            <p className="text-[13.5px] leading-relaxed text-[var(--color-text-secondary)]">
              Host a round, share the game code, and everyone submits their sips from their
              own phone. The live leaderboard keeps score across all nine holes — no paper
              scorecard, no sign-up, and nothing to download.
            </p>
          </div>

          <div>
            <h2 className="text-[var(--color-text)] font-bold text-[15px] mb-2">
              Built for your pub crawl
            </h2>
            <p className="text-[13.5px] leading-relaxed text-[var(--color-text-secondary)]">
              Customise the course and drinks for your route, add penalties for
              rule-breakers, and spin the randomiser when someone needs a surprise. Perfect
              for birthdays, stag and hen dos, or any night out.{' '}
              <Link
                href="/how-to-play"
                className="text-[var(--color-text-muted)] underline decoration-dashed underline-offset-4 hover:text-[var(--color-text-secondary)] transition-colors"
              >
                Read the full pub golf rules
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </section>
  );
}
