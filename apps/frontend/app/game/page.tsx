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
  const hasUsedRandomise = currentPlayer?.randomise != null;

  if (loading) {
    return (
      <main className="min-h-full flex items-center justify-center">
        <p className="text-[var(--color-text-secondary)] animate-pulse">Loading game...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-full flex flex-col items-center justify-center p-4 gap-4">
        <p className="text-[var(--color-error)] bg-[var(--color-error-bg)] px-4 py-2 rounded-lg">{error}</p>
        <Link href="/" className="text-[var(--color-primary)] hover:underline">
          Back to Home
        </Link>
      </main>
    );
  }

  return (
    <main className="p-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-display)]">
              Game: <span className="text-[var(--color-accent)]">{gameCode.toUpperCase()}</span>
            </h1>
            <p className="text-[var(--color-text-secondary)] text-sm">
              Rally your crew
            </p>
          </div>
          <button
            onClick={() => setShowShareModal(true)}
            className="px-4 py-2 glass rounded-lg hover:bg-white/5 transition-colors text-sm shrink-0 flex items-center gap-2"
          >
            <span>Invite</span>
            <span className="text-lg">🍻</span>
          </button>
        </header>

        <section className="glass rounded-xl p-4">
          <ScoreboardTable players={players} currentPlayerId={playerId ?? undefined} />
        </section>

        <nav className="space-y-3">
          {playerId && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/submit-score"
                className="flex-1 py-3 px-4 btn-gradient text-center font-medium rounded-lg"
              >
                Log Your Sips
              </Link>
              {hasUsedRandomise ? (
                <span className="flex-1 py-3 px-4 bg-[var(--color-border)] text-[var(--color-text-secondary)] text-center font-medium rounded-lg cursor-not-allowed opacity-50">
                  Randomise Used
                </span>
              ) : (
                <Link
                  href="/randomise"
                  className="flex-1 py-3 px-4 glass text-center font-medium rounded-lg hover:bg-white/5 transition-colors border border-[var(--color-primary)]/30"
                >
                  🎰 Randomise
                </Link>
              )}
            </div>
          )}
          <Link
            href="/how-to-play"
            className="block py-3 px-4 glass text-center font-medium rounded-lg hover:bg-white/5 transition-colors"
          >
            The Rules
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
