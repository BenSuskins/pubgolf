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
  const currentPlayer = players.find(p => p.id === playerId);
  const hasUsedLucky = currentPlayer?.lucky != null;

  if (loading) {
    return (
      <main className="min-h-full flex items-center justify-center">
        <p className="text-[var(--color-text-secondary)]">Loading game...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-full flex flex-col items-center justify-center p-4 gap-4">
        <p className="text-[var(--color-error)]">{error}</p>
        <Link href="/" className="text-[var(--color-primary)] hover:underline">
          Back to Home
        </Link>
      </main>
    );
  }

  return (
    <main className="p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Game: {gameCode.toUpperCase()}</h1>
            <p className="text-[var(--color-text-secondary)] text-sm">
              Share this code with friends to join
            </p>
          </div>
          <button
            onClick={() => setShowShareModal(true)}
            className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md hover:bg-[var(--color-surface-hover)] transition-colors text-sm shrink-0"
          >
            Invite friends
          </button>
        </header>

        <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4">
          <ScoreboardTable players={players} />
        </section>

        <nav className="space-y-3">
          {playerId && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/submit-score"
                className="flex-1 py-3 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-center font-medium rounded-md transition-colors"
              >
                Submit Score
              </Link>
              {hasUsedLucky ? (
                <span className="flex-1 py-3 px-4 bg-[var(--color-border)] text-[var(--color-text-secondary)] text-center font-medium rounded-md cursor-not-allowed">
                  Randomise
                </span>
              ) : (
                <Link
                  href="/randomise"
                  className="flex-1 py-3 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-center font-medium rounded-md transition-colors"
                >
                  Randomise
                </Link>
              )}
            </div>
          )}
          <Link
            href="/how-to-play"
            className="block py-3 px-4 bg-[var(--color-surface)] border border-[var(--color-border)] text-center font-medium rounded-md hover:bg-[var(--color-surface-hover)] transition-colors"
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
