import Link from 'next/link';
import { GolfBallLogo } from './GolfBallLogo';

export function MarketingHeader() {
  return (
    <header className="page-container flex flex-wrap items-center justify-between gap-4 py-5">
      <Link
        href="/"
        aria-label="Pub Golf home"
        className="flex items-center gap-3 font-display text-xl"
      >
        <GolfBallLogo size={32} /> PUB GOLF
      </Link>
      <nav aria-label="Main navigation" className="flex items-center gap-4 text-sm">
        <Link
          href="/how-to-play"
          className="inline-flex min-h-11 items-center text-[var(--color-text-secondary)]"
        >
          How to play
        </Link>
        <Link
          href="/play?mode=join"
          className="inline-flex min-h-11 items-center rounded-xl border border-[var(--color-border)] px-4"
        >
          Join a round
        </Link>
      </nav>
    </header>
  );
}
