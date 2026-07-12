'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
    setSelectedPubs(selectedPubs.filter((_, i) => i !== index));
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
          toast.warning('Pub route could not be saved', {
            description: 'Game created successfully, but the route map was not saved. Try setting it again later.',
          });
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
        placeholder="e.g. Big Dave"
        disabled={loading}
        fullWidth
      />

      <div className="space-y-4">
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

        {addPubRoute && (
          <div className="space-y-4 p-4 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)]">
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
        size="lg"
        className="w-full text-xl"
      >
        {loading ? 'Creating...' : 'TEE OFF →'}
      </Button>
    </form>
  );
}
