'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createGame, setPubs } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { PlaceSearchResult, Pub } from '@/lib/types';
import PubSearchAutocomplete from './PubSearchAutocomplete';
import PubSlotList from './PubSlotList';
import MiniMapPreview from './MiniMapPreview';

export function CreateGameForm() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [addPubRoute, setAddPubRoute] = useState(false);
  const [selectedPubs, setSelectedPubs] = useState<Pub[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { setGameSession } = useLocalStorage();

  const handlePubSelect = (place: PlaceSearchResult) => {
    if (selectedPubs.length < 9) {
      setSelectedPubs([...selectedPubs, {
        name: place.name,
        latitude: place.latitude,
        longitude: place.longitude,
      }]);
    }
  };

  const handlePubRemove = (index: number) => {
    setSelectedPubs(selectedPubs.slice(0, index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    if (addPubRoute && selectedPubs.length !== 9) {
      setError('Please select exactly 9 pubs for the route');
      return;
    }

    setLoading(true);
    try {
      const response = await createGame(name.trim());
      setGameSession(response.gameCode, response.playerId, response.playerName);

      if (addPubRoute && selectedPubs.length === 9) {
        try {
          await setPubs(response.gameCode, response.playerId, selectedPubs);
        } catch (err) {
          console.error('Failed to set pubs:', err);
        }
      }

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

      <div className="space-y-4">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={addPubRoute}
            onChange={(e) => setAddPubRoute(e.target.checked)}
            disabled={loading}
            className="w-5 h-5 rounded border-[var(--color-border)] bg-[var(--color-bg)] accent-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            Add Route Map
          </span>
        </label>

        {addPubRoute && (
          <div className="space-y-4 p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)]">
            <PubSearchAutocomplete
              value={searchQuery}
              onChange={setSearchQuery}
              onSelect={handlePubSelect}
              biasLatitude={selectedPubs[0]?.latitude}
              biasLongitude={selectedPubs[0]?.longitude}
            />

            {selectedPubs.length > 0 && (
              <>
                <PubSlotList pubs={selectedPubs} onRemove={handlePubRemove} />
                <MiniMapPreview pubs={selectedPubs} />
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <p id="create-name-error" role="alert" className="text-[var(--color-error)] text-sm bg-[var(--color-error-bg)] px-3 py-2 rounded-lg">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading || (addPubRoute && selectedPubs.length !== 9)}
        className="w-full py-3 px-4 btn-gradient rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
      >
        {loading ? 'Creating...' : "Let's Go!"}
      </button>
    </form>
  );
}
