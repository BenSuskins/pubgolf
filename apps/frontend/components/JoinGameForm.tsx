'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { joinGame } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ErrorMessage } from './ui/ErrorMessage';

export function JoinGameForm() {
  const [name, setName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [offerRejoin, setOfferRejoin] = useState(false);
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

  const join = async (rejoin: boolean) => {
    setError('');
    setOfferRejoin(false);

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
      const response = await joinGame(gameCode.trim().toUpperCase(), name.trim(), rejoin);
      setGameSession(response.gameCode, response.playerId);
      router.push('/game');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join game';
      setError(message);
      // A duplicate name usually means the same person on a new device or after
      // cleared storage; offer to reclaim the player instead of dead-ending.
      if (!rejoin && message.includes('already taken')) {
        setOfferRejoin(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await join(false);
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
        placeholder="e.g. Big Dave"
        disabled={loading}
        fullWidth
      />
      <Input
        id="game-code"
        label="Game Code"
        type="text"
        value={gameCode}
        onChange={(e) => setGameCode(e.target.value.toUpperCase())}
        placeholder="e.g. PAR780"
        disabled={loading}
        className="font-display text-lg tracking-[0.06em] text-[var(--color-accent)]"
        fullWidth
      />
      {error && <ErrorMessage message={error} variant="inline" />}
      {offerRejoin && (
        <Button
          type="button"
          onClick={() => join(true)}
          disabled={loading}
          variant="secondary"
          className="w-full"
        >
          That&apos;s me — rejoin as {name.trim()}
        </Button>
      )}
      <Button
        type="submit"
        disabled={loading}
        loading={loading}
        size="lg"
        className="w-full text-xl"
      >
        {loading ? 'Joining...' : 'JOIN THE ROUND →'}
      </Button>
    </form>
  );
}
