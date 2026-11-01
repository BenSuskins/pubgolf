import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { GolfBallLogo } from '@/components/GolfBallLogo';
import { HomeGameEntry } from '@/components/HomeGameEntry';
import { RULES_HREF } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Play Pub Golf',
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/play',
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

export default function PlayPage() {
  return (
    <main className="min-h-full flex flex-col items-center justify-start bg-ambient p-6 pb-12">
      <div className="w-full max-w-lg space-y-5">
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
            href={RULES_HREF}
            className="text-[13px] text-[var(--color-text-muted)] border-b border-dashed border-[var(--color-border-subtle)] pb-0.5 hover:text-[var(--color-text-secondary)] transition-colors"
          >
            First time? Learn the rules
          </Link>
        </div>
      </div>
    </main>
  );
}
