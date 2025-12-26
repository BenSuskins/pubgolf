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
        <label htmlFor="join-name" className="block text-sm font-medium mb-1">
          Your Name
        </label>
        <input
          id="join-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
      </div>
      <div>
        <label htmlFor="game-code" className="block text-sm font-medium mb-1">
          Game Code
        </label>
        <input
          id="game-code"
          type="text"
          value={gameCode}
          onChange={(e) => setGameCode(e.target.value.toUpperCase())}
          placeholder="Enter game code"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors"
      >
        {loading ? 'Joining...' : 'Join Game'}
      </button>
    </form>
  );
}
