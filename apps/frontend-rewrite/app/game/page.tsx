'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getGameState } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ScoreboardTable } from '@/components/ScoreboardTable';
import { ShareModal } from '@/components/ShareModal';
import { Player } from '@/lib/types';

export default function GamePage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameCode, setGameCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const router = useRouter();
  const { getGameCode, getPlayerId } = useLocalStorage();

  const fetchGame = useCallback(async () => {
    const code = getGameCode();
    if (!code) {
      router.push('/');
      return;
    }

    setGameCode(code);

    try {
      const state = await getGameState(code);
      setPlayers(state.players);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game');
    } finally {
      setLoading(false);
    }
  }, [getGameCode, router]);

  useEffect(() => {
    fetchGame();
    const interval = setInterval(fetchGame, 30000);
    return () => clearInterval(interval);
  }, [fetchGame]);

  const playerId = getPlayerId();

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading game...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
        <p className="text-red-500">{error}</p>
        <Link href="/" className="text-blue-600 hover:underline">
          Back to Home
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Game: {gameCode.toUpperCase()}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Share this code with friends to join
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowShareModal(true)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
            >
              Share Game Invite
            </button>
          </div>
        </header>

        <section className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <ScoreboardTable players={players} />
        </section>

        <nav className="space-y-3">
          {playerId && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/submit-score"
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-center font-medium rounded-md transition-colors"
              >
                Submit Score
              </Link>
              <Link
                href="/lucky"
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-center font-medium rounded-md transition-colors"
              >
                I&apos;m Feeling Lucky
              </Link>
            </div>
          )}
          <Link
            href="/how-to-play"
            className="block py-3 px-4 border border-gray-300 dark:border-gray-600 text-center font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            How to Play
          </Link>
        </nav>
      </div>

      {showShareModal && (
        <ShareModal
          gameCode={gameCode}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </main>
  );
}
