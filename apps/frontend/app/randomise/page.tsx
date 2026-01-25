'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { SlotMachine } from '@/components/SlotMachine';
import { getRandomiseOptions, spinWheel, ApiError } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';

const Confetti = dynamic(() => import('react-confetti'), { ssr: false });

interface WheelOption {
  option: string;
  optionSize?: number;
}

export default function RandomisePage() {
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

    async function fetchRandomiseOptions() {
      try {
        const data = await getRandomiseOptions();
        setItems(data.options.map((opt: WheelOption) => opt.option));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load randomise options');
      } finally {
        setLoading(false);
      }
    }

    fetchRandomiseOptions();
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
        <p className="text-[var(--color-text-secondary)] animate-pulse" role="status" aria-live="polite">
          Loading wheel...
        </p>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-full flex flex-col items-center justify-center p-4 gap-4">
        <p className="text-[var(--color-error)] bg-[var(--color-error-bg)] px-4 py-2 rounded-lg">
          {error || 'No wheel options available'}
        </p>
        <Link href="/game" className="text-[var(--color-primary)] hover:underline">
          Back to Game
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-full flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <Typography variant="title" className="mb-2">
            Randomise
          </Typography>
          <Typography as="p" color="secondary">
            Feeling adventurous? Spin the wheel!
          </Typography>
        </div>

        <Card padding="lg" className="space-y-6">
          <SlotMachine
            items={items}
            winningIndex={winningIndex}
            spinning={spinning}
            onSpinEnd={handleSpinEnd}
            spinDuration={3}
          />

          {hasSpun && result && !spinning && (
            <div className="space-y-2 text-center animate-fade-in">
              <Confetti numberOfPieces={500} recycle={false} />
              <p className="text-xl font-bold">
                <span className="text-[var(--color-accent)]">{result}</span>
                <span className="text-[var(--color-text-secondary)]"> for Hole {hole}!</span>
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-[var(--color-error-bg)] text-[var(--color-error)] rounded-lg text-center text-sm">
              {error}
            </div>
          )}
        </Card>

        <div className="space-y-3">
          <button
            onClick={handleSpin}
            disabled={spinning || hasSpun}
            className={`w-full py-3 px-4 font-medium rounded-lg transition-all ${
              spinning || hasSpun
                ? 'bg-[var(--color-border)] text-[var(--color-text-secondary)] cursor-not-allowed opacity-50'
                : 'btn-gradient animate-pulse-glow'
            }`}
          >
            {spinning ? 'Spinning...' : hasSpun ? 'Already Spun' : 'Spin the Wheel'}
          </button>

          <Link
            href="/game"
            className="block w-full py-3 px-4 glass text-center font-medium rounded-lg hover:bg-white/5 transition-colors"
          >
            Back to Scoreboard
          </Link>
        </div>
      </div>
    </main>
  );
}
