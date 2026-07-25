'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createGame } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ErrorMessage } from './ui/ErrorMessage';

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
      setGameSession(response.gameCode, response.playerId);
      router.push('/game');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="create-name"
        label="Your Name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Big Dave"
        disabled={loading}
        fullWidth
      />

      {error && <ErrorMessage message={error} variant="inline" />}
      <Button
        type="submit"
        disabled={loading}
        loading={loading}
        size="lg"
        className="w-full text-xl"
      >
        {loading ? 'Creating...' : 'TEE OFF →'}
      </Button>
    </form>
  );
}
