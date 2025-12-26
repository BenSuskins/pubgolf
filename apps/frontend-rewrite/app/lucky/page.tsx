'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { getWheelOptions, spinWheel, ApiError } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const Wheel = dynamic(
  () => import('react-custom-roulette').then((mod) => mod.Wheel),
  { ssr: false }
);

const Confetti = dynamic(() => import('react-confetti'), { ssr: false });

interface WheelData {
  option: string;
  optionSize?: number;
}

export default function LuckyPage() {
  const [wheelData, setWheelData] = useState<WheelData[]>([]);
  const [mustSpin, setMustSpin] = useState(false);
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
        setWheelData(data.options);
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

      const index = wheelData.findIndex((item) => item.option === data.result);
      if (index === -1) {
        throw new Error(`Result "${data.result}" not found in wheel options`);
      }

      setPrizeIndex(index);
      setResult(data.result);
      setHole(data.hole);
      requestAnimationFrame(() => setMustSpin(true));
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('You have already used your spin for this game!');
        setHasSpun(true);
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading wheel...</p>
      </main>
    );
  }

  if (wheelData.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
        <p className="text-red-500">{error || 'No wheel options available'}</p>
        <Link href="/game" className="text-blue-600 hover:underline">
          Back to Game
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-2xl font-bold">I&apos;m Feeling Lucky</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Spin the wheel to get a random challenge!
        </p>

        <div className="flex justify-center">
          <Wheel
            mustStartSpinning={mustSpin}
            prizeNumber={prizeIndex}
            data={wheelData}
            backgroundColors={['#2563eb', '#4b5563']}
            textColors={['#fff']}
            spinDuration={0.9}
            radiusLineColor="#fff"
            outerBorderColor="#2563eb"
            fontSize={14}
            onStopSpinning={() => {
              setMustSpin(false);
              setHasSpun(true);
            }}
          />
        </div>

        {hasSpun && result && (
          <div className="space-y-2">
            <Confetti numberOfPieces={500} recycle={false} />
            <p className="text-xl font-bold text-blue-600">
              You got: {result} for Hole {hole}!
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleSpin}
            disabled={mustSpin || hasSpun}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
          >
            {mustSpin ? 'Spinning...' : hasSpun ? 'Already Spun' : 'Spin the Wheel!'}
          </button>

          <Link
            href="/game"
            className="block w-full py-3 px-4 border border-gray-300 dark:border-gray-600 text-center font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Back to Game
          </Link>
        </div>
      </div>
    </main>
  );
}
