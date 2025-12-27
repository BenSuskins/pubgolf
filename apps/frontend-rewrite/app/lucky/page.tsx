'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import RoulettePro from 'react-roulette-pro';
import 'react-roulette-pro/dist/index.css';
import { getWheelOptions, spinWheel, ApiError } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const Confetti = dynamic(() => import('react-confetti'), { ssr: false });

interface WheelOption {
  option: string;
  optionSize?: number;
}

interface Prize {
  id: number;
  image: string;
  text: string;
}

// Transparent 1x1 pixel PNG as placeholder since library requires image
const PLACEHOLDER_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export default function LuckyPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [start, setStart] = useState(false);
  const [prizeIndex, setPrizeIndex] = useState(0);
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
        const transformedPrizes: Prize[] = data.options.map(
          (opt: WheelOption, index: number) => ({
            id: index,
            image: PLACEHOLDER_IMAGE,
            text: opt.option,
          })
        );
        setPrizes(transformedPrizes);
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

      const index = prizes.findIndex((item) => item.text === data.result);
      if (index === -1) {
        throw new Error(`Result "${data.result}" not found in wheel options`);
      }

      setPrizeIndex(index);
      setResult(data.result);
      setHole(data.hole);
      setStart(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('You have already used your spin for this game!');
        setHasSpun(true);
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    }
  };

  const handlePrizeDefined = () => {
    setStart(false);
    setHasSpun(true);
  };

  if (loading) {
    return (
      <main className="min-h-full flex items-center justify-center">
        <p className="text-[var(--color-text-secondary)]">Loading wheel...</p>
      </main>
    );
  }

  if (prizes.length === 0) {
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
          <h1 className="text-2xl font-bold mb-2">I&apos;m Feeling Lucky</h1>
          <p className="text-[var(--color-text-secondary)]">
            Spin the wheel to get a random challenge!
          </p>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6 space-y-6 text-center">
          <div className="flex justify-center">
            <RoulettePro
              prizes={prizes}
              prizeIndex={prizeIndex}
              start={start}
              onPrizeDefined={handlePrizeDefined}
              spinningTime={0.9}
              prizeItemRenderFunction={(item) => (
                <div className="flex items-center justify-center h-full w-full px-4 py-2 bg-[var(--color-primary)] text-white font-medium text-sm rounded">
                  {item.text}
                </div>
              )}
            />
          </div>

          {hasSpun && result && (
            <div className="space-y-2">
              <Confetti numberOfPieces={500} recycle={false} />
              <p className="text-xl font-bold text-[var(--color-primary)]">
                You got: {result} for Hole {hole}!
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-[var(--color-error-bg)] text-[var(--color-error)] rounded-md">
              {error}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={handleSpin}
            disabled={start || hasSpun}
            className="w-full py-3 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:bg-[var(--color-primary-disabled)] disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
          >
            {start ? 'Spinning...' : hasSpun ? 'Already Spun' : 'Spin the Wheel!'}
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
