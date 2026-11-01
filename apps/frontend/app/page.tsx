import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingHeader } from '@/components/MarketingHeader';
import { homeStructuredDataJson } from './homeStructuredData';

export const metadata: Metadata = { alternates: { canonical: '/' } };

const benefits = [
  ['Make it your round', 'Choose your drinks, set the pars, and build a pub route for your group.'],
  [
    'Keep everyone in the game',
    'Share a code or invite link. Everyone joins and records their scores from their own phone.',
  ],
  [
    'Follow every score',
    'See the live leaderboard, add penalties, and keep the round moving without a paper scorecard.',
  ],
];

export default function HomePage() {
  return (
    <div className="bg-ambient min-h-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: homeStructuredDataJson }}
      />
      <MarketingHeader />
      <main className="page-container pb-12 md:pb-20">
        <section className="grid items-center gap-10 py-10 md:py-16 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-6">
            <p className="eyebrow text-[var(--color-accent)]">9 Holes · 9 Drinks · 1 Champion</p>
            <h1 className="font-display text-6xl leading-[1.02] md:text-7xl lg:text-8xl">
              YOUR ROUND.
              <br />
              <span className="text-[var(--color-accent)]">EVERY SIP.</span>
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-[var(--color-text-secondary)] md:text-lg">
              The free pub golf score tracker for your next pub crawl. Set up a round, invite your
              friends, and keep score together.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/play?mode=host"
                className="btn-gradient inline-flex min-h-12 items-center justify-center rounded-xl px-6 py-3"
              >
                Host a round →
              </Link>
              <Link
                href="/play?mode=join"
                className="glass inline-flex min-h-12 items-center justify-center rounded-xl px-6 py-3 font-bold"
              >
                Join a round
              </Link>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              No sign-up. Nothing to download.
            </p>
          </div>
          <figure
            className="glass min-w-0 rounded-3xl p-5 md:p-8"
            aria-label="Example pub golf leaderboard"
          >
            <figcaption className="mb-6 flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--color-text-secondary)]">
              <span>Example round · Hole 3 of 9</span>
              <span className="eyebrow text-[var(--color-accent)]">Preview</span>
            </figcaption>
            <h2 className="mb-5 font-display text-3xl">THE LEADERBOARD</h2>
            <ol className="space-y-3">
              {[
                ['Alex', '−2'],
                ['Sam', 'E'],
                ['Charlie', '+1'],
              ].map(([name, score], index) => (
                <li key={name} className="surface-inset flex items-center gap-4 rounded-xl p-4">
                  <span className="font-display text-xl text-[var(--color-accent)]">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 break-words font-bold">{name}</span>
                  <span className="font-display text-2xl">{score}</span>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-sm text-[var(--color-text-secondary)]">
              Scores relative to par. Lowest score wins.
            </p>
          </figure>
        </section>
        <section
          aria-label="Why play with Pub Golf"
          className="grid gap-6 border-t border-[var(--color-border)] py-8 md:grid-cols-3 md:py-12"
        >
          {benefits.map(([title, description]) => (
            <div key={title} className="space-y-3">
              <h2 className="font-display text-2xl">{title}</h2>
              <p className="text-base leading-relaxed text-[var(--color-text-secondary)]">
                {description}
              </p>
            </div>
          ))}
        </section>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] p-6">
          <p className="text-[var(--color-text-secondary)]">
            First round? Get the basics before you tee off.
          </p>
          <Link
            href="/how-to-play"
            className="inline-flex min-h-11 items-center font-bold text-[var(--color-accent)] underline underline-offset-4"
          >
            Learn the rules →
          </Link>
        </div>
      </main>
    </div>
  );
}
