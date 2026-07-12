'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SlotMachine } from '@/components/SlotMachine';
import { getRandomiseOptions, spinWheel, ApiError } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';

interface WheelOption {
  option: string;
  optionSize?: number;
}

// Repeat each option by its server weight and shuffle, so the reel's visual
// frequency matches the real odds of the draw.
function weightedShuffle(options: WheelOption[]): string[] {
  const weighted = options.flatMap((opt) => Array<string>(Math.max(1, opt.optionSize ?? 1)).fill(opt.option));
  for (let i = weighted.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [weighted[i], weighted[j]] = [weighted[j], weighted[i]];
  }
  return weighted;
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
        setItems(weightedShuffle(data.options));
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
    <main className="min-h-full flex flex-col p-5 max-w-md mx-auto w-full">
      <div className="w-full space-y-6 flex-1 flex flex-col">
        <div>
          <Link
            href="/game"
            className="text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
          >
            ← Back to Scoreboard
          </Link>
        </div>

        <div className="text-center">
          <Typography variant="title" className="text-3xl">
            Wildcard
          </Typography>
          <Typography as="p" color="secondary" className="mt-2 text-[13.5px]">
            One spin per game. Feeling lucky?
          </Typography>
        </div>

        <Card padding="md" className="space-y-4">
          <SlotMachine
            items={items}
            winningIndex={winningIndex}
            spinning={spinning}
            onSpinEnd={handleSpinEnd}
            spinDuration={3}
          />

          {error && (
            <div className="p-3 bg-[var(--color-error-bg)] text-[var(--color-error)] rounded-xl text-center text-sm">
              {error}
            </div>
          )}
        </Card>

        {hasSpun && result && !spinning && (
          <div className="text-center animate-fade-in">
            <p className="text-sm text-[var(--color-text-faint)]">
              Landed on:{' '}
              <span className="text-[var(--color-accent)] font-bold">{result}</span>
              <span className="text-[var(--color-text-secondary)]"> — Hole {hole}</span>
            </p>
          </div>
        )}

        <div className="flex-1" />

        <button
          onClick={handleSpin}
          disabled={spinning || hasSpun}
          className={`w-full py-[19px] px-4 rounded-2xl text-lg transition-all ${
            spinning || hasSpun
              ? 'font-display bg-[var(--color-border)] text-[var(--color-text-secondary)] cursor-not-allowed opacity-50'
              : 'btn-gradient'
          }`}
        >
          {spinning ? 'SPINNING...' : hasSpun ? 'WILDCARD USED' : 'SPIN THE WHEEL'}
        </button>
      </div>
    </main>
  );
}
