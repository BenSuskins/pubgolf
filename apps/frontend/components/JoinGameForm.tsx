'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { joinGame } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export function JoinGameForm() {
  const [name, setName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setGameSession } = useLocalStorage();
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const codeFromUrl = searchParams.get('gameCode');
    if (codeFromUrl) {
      setGameCode(codeFromUrl.toUpperCase());

      // Auto-focus name input after a short delay to allow accordion animation
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 250);

      return () => clearTimeout(timer);
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
      <Input
        ref={nameInputRef}
        id="join-name"
        label="Your Name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
        disabled={loading}
        fullWidth
      />
      <Input
        id="game-code"
        label="Game Code"
        type="text"
        value={gameCode}
        onChange={(e) => setGameCode(e.target.value.toUpperCase())}
        placeholder="e.g. ABC123"
        disabled={loading}
        className="font-mono tracking-wider"
        fullWidth
      />
      {error && (
        <p id="join-form-error" role="alert" className="text-[var(--color-error)] text-sm bg-[var(--color-error-bg)] px-3 py-2 rounded-lg">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={loading}
        loading={loading}
        className="w-full"
      >
        {loading ? 'Joining...' : "I'm In!"}
      </Button>
    </form>
  );
}
