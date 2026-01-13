'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CreateGameForm } from '@/components/CreateGameForm';
import { JoinGameForm } from '@/components/JoinGameForm';

function HomeContent() {
  const searchParams = useSearchParams();
  const hasGameCode = searchParams.get('gameCode');
  const [activeSection, setActiveSection] = useState<'create' | 'join' | null>(
    hasGameCode ? 'join' : null
  );

  return (
    <div className="w-full max-w-lg space-y-10">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        {/* Hero illustration with glow effect */}
        <div className="relative w-48 h-48 mx-auto animate-float">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] opacity-20 blur-2xl absolute inset-0" />
          {/* Golf flag + beer icon placeholder - replace with AI image when ready */}
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            <div className="text-8xl drop-shadow-2xl" role="img" aria-label="Golf and beer">
              🏌️‍♂️🍺
            </div>
          </div>
        </div>

        <div>
          <h1 className="text-5xl sm:text-6xl font-bold font-[family-name:var(--font-display)] gradient-text mb-3">
            Pub Golf
          </h1>
          <p className="text-xl text-[var(--color-text-secondary)]">
            9 Holes. 9 Drinks. 1 Champion.
          </p>
        </div>
      </div>

      {/* Action Cards */}
      <div className="space-y-4">
        {/* Start a Round */}
        <section className="glass rounded-xl overflow-hidden">
          <button
            onClick={() => setActiveSection(prev => prev === 'create' ? null : 'create')}
            aria-expanded={activeSection === 'create'}
            aria-controls="create-game-section"
            aria-label="Start a new game round"
            className="w-full p-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">🏌️</span>
              <span className="text-xl font-semibold font-[family-name:var(--font-display)]">Start a Round</span>
            </div>
            <svg
              className={`w-5 h-5 text-[var(--color-text-secondary)] transition-transform duration-200 ${activeSection === 'create' ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            id="create-game-section"
            role="region"
            aria-labelledby="create-button-label"
            className="grid transition-[grid-template-rows] duration-200 ease-out"
            style={{ gridTemplateRows: activeSection === 'create' ? '1fr' : '0fr' }}
          >
            <div className="overflow-hidden">
              <div className="p-5 pt-0 border-t border-[var(--color-glass-border)]">
                <div className="pt-5">
                  <CreateGameForm />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Join the Party */}
        <section className="glass rounded-xl overflow-hidden">
          <button
            onClick={() => setActiveSection(prev => prev === 'join' ? null : 'join')}
            aria-expanded={activeSection === 'join'}
            aria-controls="join-game-section"
            aria-label="Join an existing game"
            className="w-full p-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">🍻</span>
              <span className="text-xl font-semibold font-[family-name:var(--font-display)]">Join the Party</span>
            </div>
            <svg
              className={`w-5 h-5 text-[var(--color-text-secondary)] transition-transform duration-200 ${activeSection === 'join' ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            id="join-game-section"
            role="region"
            aria-labelledby="join-button-label"
            className="grid transition-[grid-template-rows] duration-200 ease-out"
            style={{ gridTemplateRows: activeSection === 'join' ? '1fr' : '0fr' }}
          >
            <div className="overflow-hidden">
              <div className="p-5 pt-0 border-t border-[var(--color-glass-border)]">
                <div className="pt-5">
                  <JoinGameForm />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Rules Link */}
      <Link
        href="/how-to-play"
        className="block w-full p-4 glass rounded-xl text-center hover:bg-white/5 transition-colors group"
      >
        <span className="text-lg font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-text)] transition-colors">
          First time? Learn the rules →
        </span>
      </Link>
    </div>
  );
}

export default function HomePage() {
  return (
    <section className="min-h-full flex flex-col items-center justify-center p-6 py-12">
      <Suspense fallback={
        <div className="text-[var(--color-text-secondary)] animate-pulse">
          Loading...
        </div>
      }>
        <HomeContent />
      </Suspense>
    </section>
  );
}
