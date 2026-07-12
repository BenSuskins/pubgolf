'use client';

import { useRouter } from 'next/navigation';

export function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
    >
      ← Back to Scoreboard
    </button>
  );
}
