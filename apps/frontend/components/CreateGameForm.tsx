'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createGame, setPubs } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { PlaceSearchResult, Pub } from '@/lib/types';
import PubSearchAutocomplete from './PubSearchAutocomplete';
import PubSlotList from './PubSlotList';
import MiniMapPreview from './MiniMapPreview';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ErrorMessage } from './ui/ErrorMessage';

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
      <Input
        id="create-name"
        label="Your Name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
        disabled={loading}
        fullWidth
      />

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

      {error && <ErrorMessage message={error} variant="inline" />}
      <Button
        type="submit"
        disabled={loading || (addPubRoute && selectedPubs.length !== 9)}
        loading={loading}
        className="w-full"
      >
        {loading ? 'Creating...' : "Let's Go!"}
      </Button>
    </form>
  );
}
