'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { CreateGameForm } from '@/components/CreateGameForm';
import { JoinGameForm } from '@/components/JoinGameForm';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Pub Golf</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your pub golf scores with friends
          </p>
        </div>

        <div className="space-y-6">
          <section className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Create a Game</h2>
            <CreateGameForm />
          </section>

          <div className="flex items-center gap-4">
            <hr className="flex-1 border-gray-200 dark:border-gray-700" />
            <span className="text-gray-500 dark:text-gray-400 text-sm">or</span>
            <hr className="flex-1 border-gray-200 dark:border-gray-700" />
          </div>

          <section className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Join a Game</h2>
            <Suspense fallback={<div>Loading...</div>}>
              <JoinGameForm />
            </Suspense>
          </section>
        </div>

        <div className="text-center">
          <Link
            href="/how-to-play"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            How to Play
          </Link>
        </div>
      </div>
    </main>
  );
}
