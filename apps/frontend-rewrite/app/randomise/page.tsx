'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { SlotMachine } from '@/components/SlotMachine';
import { getWheelOptions, spinWheel, ApiError } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const Confetti = dynamic(() => import('react-confetti'), { ssr: false });

interface WheelOption {
  option: string;
  optionSize?: number;
}

export default function LuckyPage() {
  const [items, setItems] = useState<string[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [winningIndex, setWinningIndex] = useState<number | null>(null);
  const [hasSpun, setHasSpun] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [hole, setHole] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { getGameCode, getPlayerId } = useLocalStorage();

  useEffect(() => {
    const gameCode = getGameCode();
    const playerId = getPlayerId();

    if (!gameCode || !playerId) {
      router.push('/');
      return;
    }

    async function fetchWheelOptions() {
      try {
        const data = await getWheelOptions();
        setItems(data.options.map((opt: WheelOption) => opt.option));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load wheel options');
      } finally {
        setLoading(false);
      }
    }

    fetchWheelOptions();
  }, [getGameCode, getPlayerId, router]);

  const handleSpin = async () => {
    setError(null);
    const gameCode = getGameCode();
    const playerId = getPlayerId();

    if (!gameCode || !playerId) {
      setError('Missing game or player information');
      return;
    }

    try {
      const data = await spinWheel(gameCode, playerId);

      const index = items.findIndex((item) => item === data.result);
      if (index === -1) {
        throw new Error(`Result "${data.result}" not found in wheel options`);
      }

      setWinningIndex(index);
      setResult(data.result);
      setHole(data.hole);
      setSpinning(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('You have already used your spin for this game!');
        setHasSpun(true);
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    }
  };

  const handleSpinEnd = () => {
    setSpinning(false);
    setHasSpun(true);
  };

  if (loading) {
    return (
      <main className="min-h-full flex items-center justify-center">
        <p className="text-[var(--color-text-secondary)]">Loading wheel...</p>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-full flex flex-col items-center justify-center p-4 gap-4">
        <p className="text-[var(--color-error)]">{error || 'No wheel options available'}</p>
        <Link href="/game" className="text-[var(--color-primary)] hover:underline">
          Back to Game
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-full flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Randomise</h1>
          <p className="text-[var(--color-text-secondary)]">
            Want to switch up your drink?
          </p>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6 space-y-6">
          <SlotMachine
            items={items}
            winningIndex={winningIndex}
            spinning={spinning}
            onSpinEnd={handleSpinEnd}
            spinDuration={3}
          />

          {hasSpun && result && !spinning && (
            <div className="space-y-2 text-center">
              <Confetti numberOfPieces={500} recycle={false} />
              <p className="text-xl font-bold text-[var(--color-primary)]">
                You got: {result} for Hole {hole}!
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-[var(--color-error-bg)] text-[var(--color-error)] rounded-md text-center">
              {error}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={handleSpin}
            disabled={spinning || hasSpun}
            className="w-full py-3 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:bg-[var(--color-primary-disabled)] disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
          >
            {spinning ? 'Spinning...' : hasSpun ? 'Already Spun' : 'Spin'}
          </button>

          <Link
            href="/game"
            className="block w-full py-3 px-4 bg-[var(--color-surface)] border border-[var(--color-border)] text-center font-medium rounded-md hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            Back to Game
          </Link>
        </div>
      </div>
    </main>
  );
}
