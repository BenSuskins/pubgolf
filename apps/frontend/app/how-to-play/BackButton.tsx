'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

const LINK_CLASSES =
  'text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors';

export function BackButton({ fromGame }: { fromGame: boolean }) {
  const router = useRouter();

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
    <button onClick={() => router.back()} className={LINK_CLASSES}>
      ← Back to Scoreboard
    </button>
  );
}
