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
        <p className="text-gray-600 dark:text-gray-400">
          Track your pub golf scores with friends
        </p>
      </div>

      <div className="space-y-3">
        <section className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('create')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="text-xl font-semibold">Create a Game</span>
            <svg
              className={`w-5 h-5 transition-transform ${activeSection === 'create' ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {activeSection === 'create' && (
            <div className="p-4 pt-0 border-t border-gray-200 dark:border-gray-700">
              <div className="pt-4">
                <CreateGameForm />
              </div>
            </div>
          )}
        </section>

        <section className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('join')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="text-xl font-semibold">Join a Game</span>
            <svg
              className={`w-5 h-5 transition-transform ${activeSection === 'join' ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {activeSection === 'join' && (
            <div className="p-4 pt-0 border-t border-gray-200 dark:border-gray-700">
              <div className="pt-4">
                <JoinGameForm />
              </div>
            </div>
          )}
        </section>
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      <Link
        href="/how-to-play"
        className="block w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-xl font-semibold text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        How to Play
      </Link>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
        <HomeContent />
      </Suspense>
    </main>
  );
}
