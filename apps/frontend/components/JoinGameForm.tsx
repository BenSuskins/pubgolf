'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { joinGame } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export function JoinGameForm() {
  const [name, setName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setGameSession } = useLocalStorage();

  useEffect(() => {
    const codeFromUrl = searchParams.get('gameCode');
    if (codeFromUrl) {
      setGameCode(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    if (!gameCode.trim()) {
      setError('Game code is required');
      return;
    }

    setLoading(true);
    try {
      const response = await joinGame(gameCode.trim().toUpperCase(), name.trim());
      setGameSession(response.gameCode, response.playerId, response.playerName);
      router.push('/game');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="join-name" className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]">
          Your Name
        </label>
        <input
          id="join-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="w-full px-4 py-3 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent placeholder:text-[var(--color-text-secondary)]/50 transition-all"
          disabled={loading}
        />
      </div>
      <div>
        <label htmlFor="game-code" className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]">
          Game Code
        </label>
        <input
          id="game-code"
          type="text"
          value={gameCode}
          onChange={(e) => setGameCode(e.target.value.toUpperCase())}
          placeholder="e.g. ABC123"
          className="w-full px-4 py-3 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent placeholder:text-[var(--color-text-secondary)]/50 font-mono tracking-wider transition-all"
          disabled={loading}
        />
      </div>
      {error && (
        <p className="text-[var(--color-error)] text-sm bg-[var(--color-error-bg)] px-3 py-2 rounded-lg">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 btn-gradient rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
      >
        {loading ? 'Joining...' : "I'm In!"}
      </button>
    </form>
  );
}
