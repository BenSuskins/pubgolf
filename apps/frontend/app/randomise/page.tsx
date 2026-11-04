'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SpinWheel } from '@/components/SpinWheel';
import { getRandomiseOptions, spinWheel, ApiError, WheelOption } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';

export default function RandomisePage() {
  const [options, setOptions] = useState<WheelOption[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [winningOption, setWinningOption] = useState<string | null>(null);
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
      router.push('/play');
      return;
    }

    async function fetchRandomiseOptions() {
      try {
        const data = await getRandomiseOptions();
        setOptions(data.options);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't load the Wildcard wheel. Try again.");
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

      if (!options.some((opt) => opt.option === data.result)) {
        throw new Error(`Result "${data.result}" not found in wheel options`);
      }

      setWinningOption(data.result);
      setResult(data.result);
      setHole(data.hole);
      setSpinning(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && err.message.includes('completed game')) {
        setError('This round has ended, so Wildcard is no longer available.');
        setHasSpun(true);
      } else if (err instanceof ApiError && err.status === 409 && err.message.includes('No more holes left')) {
        setError("No holes left to spin for — you've played them all!");
        setHasSpun(true);
      } else if (err instanceof ApiError && err.status === 409) {
        setError('You have already used your Wildcard this round.');
        setHasSpun(true);
      } else {
        setError(err instanceof Error ? err.message : "Couldn't use Wildcard. Try again.");
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

  if (options.length === 0) {
    return (
      <main className="min-h-full flex flex-col items-center justify-center p-4 gap-4">
        <p className="text-[var(--color-error)] bg-[var(--color-error-bg)] px-4 py-2 rounded-lg">
          {error || 'The Wildcard wheel has no options right now.'}
        </p>
        <Link href="/game" className="text-[var(--color-primary)] hover:underline">
          Back to Leaderboard
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-full flex flex-col p-5 md:p-8 max-w-5xl mx-auto w-full">
      <div className="w-full space-y-6 flex-1">
        <div>
          <Link
            href="/game"
            className="text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
          >
            ← Back to Leaderboard
          </Link>
        </div>

        <div className="text-center">
          <Typography as="h1" variant="title" className="text-3xl">
            Wildcard
          </Typography>
          <Typography as="p" color="secondary" className="mt-2 text-[13.5px]">
            One spin per round. Feeling lucky?
          </Typography>
        </div>

        <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_minmax(16rem,0.8fr)] md:gap-10">
          <Card padding="md" className="space-y-4 min-w-0">
            <div className="mx-auto w-full max-w-md">
              <SpinWheel
                options={options}
                winningOption={winningOption}
                spinning={spinning}
                onSpinEnd={handleSpinEnd}
                spinDuration={3}
              />
            </div>

            {error && (
              <div className="p-3 bg-[var(--color-error-bg)] text-[var(--color-error)] rounded-xl text-center text-sm">
                {error}
              </div>
            )}
          </Card>

          <div className="space-y-5 md:sticky md:top-8">
            {hasSpun && result && !spinning && (
              <div className="text-center animate-fade-in">
                <p className="text-sm text-[var(--color-text-faint)]">
                  Landed on:{' '}
                  <span className="text-[var(--color-accent)] font-bold">{result}</span>
                  <span className="text-[var(--color-text-secondary)]"> — Hole {hole}</span>
                </p>
              </div>
            )}

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
        </div>
      </div>
    </main>
  );
}
