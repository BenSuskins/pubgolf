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
  const [addPubRoute, setAddPubRoute] = useState(false);
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
      router.push(addPubRoute ? '/game/route' : '/game');
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

      <div className="flex items-center justify-between py-1">
        <div>
          <div className="text-sm font-semibold text-[var(--color-text)]">Add route map</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Show pub order to players
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={addPubRoute}
          aria-label="Add route map"
          disabled={loading}
          onClick={() => setAddPubRoute(!addPubRoute)}
          className={`w-11 h-[26px] rounded-full relative transition-colors shrink-0 ${
            addPubRoute ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border-subtle)]'
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full absolute top-[3px] transition-all ${
              addPubRoute
                ? 'left-[21px] bg-[var(--color-ink)]'
                : 'left-[3px] bg-[var(--color-text-secondary)]'
            }`}
          />
        </button>
      </div>

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
