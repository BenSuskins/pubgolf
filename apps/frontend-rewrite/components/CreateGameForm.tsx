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
        <label htmlFor="create-name" className="block text-sm font-medium mb-1">
          Your Name
        </label>
        <input
          id="create-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          disabled={loading}
        />
      </div>
      {error && <p className="text-[var(--color-error)] text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:bg-[var(--color-primary-disabled)] text-white font-medium rounded-md transition-colors"
      >
        {loading ? 'Creating...' : 'Create Game'}
      </button>
    </form>
  );
}
