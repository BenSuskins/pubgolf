'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setPubs } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { PlaceSearchResult, Pub } from '@/lib/types';
import PubSearchAutocomplete from '@/components/PubSearchAutocomplete';
import PubSlotList from '@/components/PubSlotList';
import MiniMapPreview from '@/components/MiniMapPreview';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

const REQUIRED_PUB_COUNT = 9;

export default function RouteBuilderPage() {
  const [selectedPubs, setSelectedPubs] = useState<Pub[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { getGameCode, getPlayerId } = useLocalStorage();

  useEffect(() => {
    if (!getGameCode() || !getPlayerId()) {
      router.push('/');
    }
  }, [getGameCode, getPlayerId, router]);

  const handlePubSelect = (place: PlaceSearchResult) => {
    if (selectedPubs.length < REQUIRED_PUB_COUNT) {
      setSelectedPubs([
        ...selectedPubs,
        { name: place.name, latitude: place.latitude, longitude: place.longitude },
      ]);
    }
  };

  const handlePubRemove = (index: number) => {
    setSelectedPubs(selectedPubs.filter((_, i) => i !== index));
  };

  const handleSaveRoute = async () => {
    const gameCode = getGameCode();
    const playerId = getPlayerId();
    if (!gameCode || !playerId) {
      router.push('/');
      return;
    }

    setError('');
    setSaving(true);
    try {
      await setPubs(gameCode, playerId, selectedPubs);
      router.push('/game');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save route');
      setSaving(false);
    }
  };

  return (
    <main className="min-h-full flex flex-col p-5 max-w-md mx-auto w-full">
      <div className="space-y-4 flex-1 flex flex-col">
        <div>
          <Link
            href="/game"
            className="text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
          >
            ← Skip for now
          </Link>
          <h1 className="font-display text-2xl text-[var(--color-text)] mt-3">Add Route Map</h1>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
            Search for each pub, in order
          </p>
        </div>

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

        {error && <ErrorMessage message={error} variant="inline" />}

        <div className="flex-1" />

        <button
          type="button"
          onClick={handleSaveRoute}
          disabled={saving || selectedPubs.length !== REQUIRED_PUB_COUNT}
          className="w-full py-[18px] px-4 btn-gradient rounded-2xl text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        >
          {saving
            ? 'SAVING...'
            : selectedPubs.length === REQUIRED_PUB_COUNT
              ? 'SAVE ROUTE'
              : `SAVE ROUTE (${selectedPubs.length}/${REQUIRED_PUB_COUNT})`}
        </button>
      </div>
    </main>
  );
}
