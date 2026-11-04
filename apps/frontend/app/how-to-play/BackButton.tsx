'use client';

import Link from 'next/link';

const LINK_CLASSES =
  'text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors';

export function BackButton({ fromGame }: { fromGame: boolean }) {

  // Reached from anywhere but a game — the home page, a search result — there is
  // no scoreboard behind us, so going back has to mean the home page.
  if (!fromGame) {
    return (
      <Link href="/" className={LINK_CLASSES}>
        ← Back to Home
      </Link>
    );
  }

  return (
    <Link href="/game" className={LINK_CLASSES}>
      ← Back to Leaderboard
    </Link>
  );
}
