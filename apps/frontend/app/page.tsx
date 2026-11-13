import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingHeader } from '@/components/MarketingHeader';
import { homeStructuredDataJson } from './homeStructuredData';

export const metadata: Metadata = { alternates: { canonical: '/' } };

const questions = [
  [
    'What is pub golf?',
    'It’s a pub crawl with a golfing twist. Each hole has a drink and a par. Count your sips, record your score and see who wins.',
  ],
  [
    'How does scoring work?',
    'Count the sips it takes to finish your drink and record them for each hole. Penalties can replace your score. The lowest total wins.',
  ],
  [
    'Do we need nine pubs?',
    'No. Each round has nine holes, but it’s up to your group how many pubs you visit.',
  ],
  [
    'How do my mates join?',
    'Share the game code or invite link. Everyone can join and record their scores on their own phone.',
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
            <h1 className="font-display text-6xl leading-[1.02] md:text-7xl lg:text-8xl">
              PUB GOLF.<br />
              <span className="text-[var(--color-accent)]">LET’S PLAY.</span>
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-[var(--color-text-secondary)] md:text-lg">
              Set up your round, get your mates together and see who comes out on top.
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
              Free to play. No sign-up or download.
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
            <h2 className="mb-5 font-display text-3xl">Who’s winning?</h2>
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
              Lowest score wins.
            </p>
          </figure>
        </section>
        <section
          className="border-t border-[var(--color-border)] py-10 md:py-14"
          aria-labelledby="how-to-play"
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
            <div>
              <h2 id="how-to-play" className="font-display text-4xl">How to play</h2>
              <p className="mt-3 max-w-sm leading-relaxed text-[var(--color-text-secondary)]">
                Your round, your mates, one shared scorecard.
              </p>
              <Link
                href="/how-to-play"
                className="mt-4 inline-flex min-h-11 items-center font-bold text-[var(--color-accent)] underline underline-offset-4"
              >
                Read the full rules →
              </Link>
            </div>
            <ol className="grid gap-6 sm:grid-cols-3">
              {[
                ['Make it your round', 'Choose your drinks and pars, then plan your route.'],
                ['Bring your mates', 'Share a code or link so everyone can join on their phone.'],
                ['Play and keep score', 'Record each hole and follow the live leaderboard. Lowest score wins.'],
              ].map(([title, description], index) => (
                <li key={title} className="border-t border-[var(--color-border-gold)] pt-4">
                  <span className="font-display text-2xl text-[var(--color-accent)]">
                    {index + 1}
                  </span>
                  <h3 className="mt-2 font-bold">{title}</h3>
                  <p className="mt-2 leading-relaxed text-[var(--color-text-secondary)]">
                    {description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <section
          className="border-t border-[var(--color-border)] py-10 md:py-14"
          aria-labelledby="faq"
        >
          <h2 id="faq" className="font-display text-4xl">The basics</h2>
          <div className="mt-8 grid gap-x-12 gap-y-8 md:grid-cols-2">
            {questions.map(([question, answer]) => (
              <div key={question}>
                <h3 className="font-bold text-[var(--color-text)]">{question}</h3>
                <p className="mt-2 max-w-xl leading-relaxed text-[var(--color-text-secondary)]">
                  {answer}
                </p>
              </div>
            ))}
          </div>
        </section>
        <section className="glass flex flex-wrap items-center justify-between gap-6 rounded-3xl p-6 md:p-8" aria-labelledby="ready-to-play">
          <div>
            <h2 id="ready-to-play" className="font-display text-3xl">Ready for your round?</h2>
            <p className="mt-2 text-[var(--color-text-secondary)]">Get your group together and let the games begin.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/play?mode=host" className="btn-gradient inline-flex min-h-12 items-center justify-center rounded-xl px-6 py-3">Host a round →</Link>
            <Link href="/play?mode=join" className="glass inline-flex min-h-12 items-center justify-center rounded-xl px-6 py-3 font-bold">Join a round</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
