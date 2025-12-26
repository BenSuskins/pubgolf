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
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Submit Score</h1>
          <p className="text-[var(--color-text-secondary)]">
            How well did you do?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg">
          <div>
            <label htmlFor="hole" className="block text-sm font-medium mb-1">
              Hole
            </label>
            <select
              id="hole"
              value={hole}
              onChange={(e) => setHole(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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
            <label htmlFor="score" className="block text-sm font-medium mb-1">
              Score
            </label>
            <input
              id="score"
              type="number"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="Enter score"
              min={-10}
              max={10}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              disabled={loading}
            />
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Score must be between -10 and 10
            </p>
          </div>

          {error && <p className="text-[var(--color-error)] text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:bg-[var(--color-primary-disabled)] text-white font-medium rounded-md transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
            <Link
              href="/game"
              className="flex-1 py-2 px-4 bg-[var(--color-surface)] border border-[var(--color-border)] text-center font-medium rounded-md hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
