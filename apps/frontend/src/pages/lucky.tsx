'use client';

import { useState } from 'react';
import { Wheel } from 'react-custom-roulette';
import { lucky } from '../services/api';

export default function LuckyPage() {
  const [outcomes, setOutcomes] = useState<{ option: string }[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [prizeIndex, setPrizeIndex] = useState<number | null>(null);
  const [mustSpin, setMustSpin] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSpin = async () => {
    setError(null);
    try {
      const data = await lucky();
      const outcomeList = data.outcomes.map((label: string) => ({ option: label }));
      const index = data.outcomes.findIndex((label: string) => label === data.result);

      if (index === -1) throw new Error(`Result "${data.result}" not found in outcomes`);

      setOutcomes(outcomeList);
      setPrizeIndex(index);
      setResult(data.result);

      // Spin on next frame to avoid render issues
      requestAnimationFrame(() => setMustSpin(true));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 space-y-4 bg-gray-100">
      {outcomes.length > 0 && typeof prizeIndex === 'number' && (
        <Wheel
          mustStartSpinning={mustSpin}
          prizeNumber={prizeIndex}
          data={outcomes}
          backgroundColors={['#facc15', '#4ade80']}
          textColors={['#1f2937']}
          spinDuration={0.9}
          radiusLineColor="#e5e7eb"
          outerBorderColor="#000000"
          fontSize={16}
          onStopSpinning={() => {
            setMustSpin(false);
            setHasSpun(true);
          }}
        />
      )}

      {!hasSpun && (
        <button
          onClick={handleSpin}
          disabled={mustSpin}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg text-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          Spin the Wheel
        </button>
      )}

      {hasSpun && result && (
        <div className="text-2xl mt-6 font-bold text-center text-purple-700">
          🎉 You got: <span className="underline">{result}</span>!
        </div>
      )}

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </main>
  );
}