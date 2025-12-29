'use client';

import { useRouter } from 'next/navigation';

export function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="py-3 px-8 glass rounded-lg hover:bg-white/5 transition-colors font-medium"
    >
      Got It
    </button>
  );
}
