'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createGame } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export function CreateGameForm() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setGameSession } = useLocalStorage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await createGame(name.trim());
      setGameSession(response.gameCode, response.playerId, response.playerName);
      router.push('/game');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="create-name" className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]">
          Your Name
        </label>
        <input
          id="create-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          aria-invalid={!!error}
          aria-describedby={error ? "create-name-error" : undefined}
          aria-required="true"
          className="w-full px-4 py-3 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent placeholder:text-[var(--color-text-secondary)]/50 transition-all"
          disabled={loading}
        />
      </div>
      {error && (
        <p id="create-name-error" role="alert" className="text-[var(--color-error)] text-sm bg-[var(--color-error-bg)] px-3 py-2 rounded-lg">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 btn-gradient rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
      >
        {loading ? 'Creating...' : "Let's Go!"}
      </button>
    </form>
  );
}
