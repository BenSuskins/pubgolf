'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { submitScore } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function SubmitScorePage() {
  const [hole, setHole] = useState(1);
  const [score, setScore] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { getGameCode, getPlayerId } = useLocalStorage();

  useEffect(() => {
    const code = getGameCode();
    const playerId = getPlayerId();
    if (!code || !playerId) {
      router.push('/');
    }
  }, [getGameCode, getPlayerId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const scoreNum = parseInt(score, 10);
    if (isNaN(scoreNum) || scoreNum < -10 || scoreNum > 10) {
      setError('Score must be between -10 and 10');
      return;
    }

    const gameCode = getGameCode();
    const playerId = getPlayerId();
    if (!gameCode || !playerId) {
      router.push('/');
      return;
    }

    setLoading(true);
    try {
      await submitScore(gameCode, playerId, hole, scoreNum);
      router.push('/game');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit score');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-full flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 font-[family-name:var(--font-display)]">Log Your Sips</h1>
          <p className="text-[var(--color-text-secondary)]">
            How'd that one go down?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6 glass rounded-xl">
          <div>
            <label htmlFor="hole" className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]">
              Hole
            </label>
            <select
              id="hole"
              value={hole}
              onChange={(e) => setHole(parseInt(e.target.value, 10))}
              className="w-full px-4 py-3 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
              disabled={loading}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((h) => (
                <option key={h} value={h}>
                  Hole {h}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="score" className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]">
              Sips Taken
            </label>
            <input
              id="score"
              type="number"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="How many sips?"
              min={-10}
              max={10}
              className="w-full px-4 py-3 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent placeholder:text-[var(--color-text-secondary)]/50 transition-all"
              disabled={loading}
            />
            <p className="text-xs text-[var(--color-text-secondary)] mt-2">
              Between -10 and 10 (penalties apply!)
            </p>
          </div>

          {error && (
            <p className="text-[var(--color-error)] text-sm bg-[var(--color-error-bg)] px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 btn-gradient rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {loading ? 'Logging...' : 'Log It'}
            </button>
            <Link
              href="/game"
              className="flex-1 py-3 px-4 glass text-center font-medium rounded-lg hover:bg-white/5 transition-colors"
            >
              Back to Scoreboard
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
