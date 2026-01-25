'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { submitScore, getPenaltyOptions, PenaltyOption } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { PenaltyType, PENALTY_EMOJI_MAP } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Counter } from '@/components/ui/Counter';

export default function SubmitScorePage() {
  const [hole, setHole] = useState(1);
  const [score, setScore] = useState(0);
  const [penaltyType, setPenaltyType] = useState<PenaltyType | null>(null);
  const [penaltyOptions, setPenaltyOptions] = useState<PenaltyOption[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { getGameCode, getPlayerId } = useLocalStorage();

  useEffect(() => {
    const code = getGameCode();
    const playerId = getPlayerId();
    if (!code || !playerId) {
      router.push('/');
    }
  }, [getGameCode, getPlayerId, router]);

  useEffect(() => {
    getPenaltyOptions()
      .then((response) => setPenaltyOptions(response.penalties))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const selectedPenalty = penaltyOptions.find((p) => p.type === penaltyType);
    const scoreNum = penaltyType && selectedPenalty ? selectedPenalty.points : score;

    const gameCode = getGameCode();
    const playerId = getPlayerId();
    if (!gameCode || !playerId) {
      router.push('/');
      return;
    }

    setLoading(true);
    try {
      await submitScore(gameCode, playerId, hole, scoreNum, penaltyType);
      router.push('/game');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit score');
    } finally {
      setLoading(false);
    }
  };

  const togglePenalty = (type: PenaltyType) => {
    setPenaltyType(penaltyType === type ? null : type);
  };

  const selectedPenalty = penaltyOptions.find((p) => p.type === penaltyType);

  return (
    <main className="min-h-full flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 font-[family-name:var(--font-display)]">Log Your Sips</h1>
          <p className="text-[var(--color-text-secondary)]">
            How&apos;d that one go down?
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card padding="lg" className="space-y-5">
          <Select
            label="Hole"
            value={hole}
            onChange={(e) => setHole(parseInt(e.target.value, 10))}
            options={[1, 2, 3, 4, 5, 6, 7, 8, 9].map((h) => ({
              value: h,
              label: `Hole ${h}`,
            }))}
            disabled={loading}
            fullWidth
          />

          <Counter
            label="Sips Taken"
            value={penaltyType && selectedPenalty ? selectedPenalty.points : score}
            onChange={setScore}
            min={-10}
            max={10}
            disabled={loading || !!penaltyType}
            ariaLabel="Sips counter"
          />

          <fieldset>
            <legend className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]">
              Penalties
            </legend>
            <div className="grid grid-cols-3 gap-3">
              {penaltyOptions.map((option) => (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => togglePenalty(option.type as PenaltyType)}
                  aria-label={`${option.name} penalty, adds ${option.points} sips`}
                  aria-pressed={penaltyType === option.type}
                  className={`p-4 rounded-lg font-medium transition-all flex flex-col items-center gap-2 min-h-[100px] ${
                    penaltyType === option.type
                      ? 'bg-[var(--color-error)] text-white ring-2 ring-[var(--color-error)]'
                      : 'glass hover:bg-white/5'
                  }`}
                  disabled={loading}
                >
                  <span className="text-3xl" aria-hidden="true">
                    {PENALTY_EMOJI_MAP[option.type as PenaltyType]}
                  </span>
                  <span className="text-sm text-center leading-tight">{option.name}</span>
                  <span className="text-lg font-bold">+{option.points}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {error && (
            <p className="text-[var(--color-error)] text-sm bg-[var(--color-error-bg)] px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 btn-gradient rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {loading ? 'Logging...' : 'Log It'}
            </button>
            <Link
              href="/game"
              className="flex-1 py-3 px-4 glass text-center font-medium rounded-lg hover:bg-white/5 transition-colors"
            >
              Back to Scoreboard
            </Link>
          </div>
          </Card>
        </form>
      </div>
    </main>
  );
}
