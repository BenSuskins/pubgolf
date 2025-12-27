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

  const toggleSection = (section: 'create' | 'join') => {
    setActiveSection(prev => prev === section ? null : section);
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">Pub Golf</h1>
        <p className="text-[var(--color-text-secondary)]">
          Track your Pub Golf scores here
        </p>
        <p className="text-[var(--color-text-secondary)]">
          Create or join a game to play
        </p>
      </div>

      <div className="space-y-3">
        <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('create')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <span className="text-xl font-semibold">Create a Game</span>
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${activeSection === 'create' ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            className="grid transition-[grid-template-rows] duration-200 ease-out"
            style={{ gridTemplateRows: activeSection === 'create' ? '1fr' : '0fr' }}
          >
            <div className="overflow-hidden">
              <div className="p-4 pt-0 border-t border-[var(--color-border)]">
                <div className="pt-4">
                  <CreateGameForm />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('join')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <span className="text-xl font-semibold">Join a Game</span>
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${activeSection === 'join' ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            className="grid transition-[grid-template-rows] duration-200 ease-out"
            style={{ gridTemplateRows: activeSection === 'join' ? '1fr' : '0fr' }}
          >
            <div className="overflow-hidden">
              <div className="p-4 pt-0 border-t border-[var(--color-border)]">
                <div className="pt-4">
                  <JoinGameForm />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <hr className="border-[var(--color-border)]" />

      <Link
        href="/how-to-play"
        className="block w-full p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-xl font-semibold text-center hover:bg-[var(--color-surface-hover)] transition-colors"
      >
        How to Play
      </Link>

      <footer className="text-center text-sm text-[var(--color-text-secondary)] space-y-2">
        <p>© 2025 Ben Suskins | Pub Golf</p>
        <p className="space-x-2">
          <Link href="/terms" className="text-[var(--color-primary)] hover:underline">
            Terms & Conditions
          </Link>
          <span>·</span>
          <Link href="/privacy" className="text-[var(--color-primary)] hover:underline">
            Privacy Policy
          </Link>
          <span>·</span>
          <a
            href="https://github.com/BenSuskins/pubgolf/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:underline"
          >
            Report an issue
          </a>
        </p>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-full flex flex-col items-center justify-center p-4">
      <Suspense fallback={<div className="text-[var(--color-text-secondary)]">Loading...</div>}>
        <HomeContent />
      </Suspense>
    </main>
  );
}
