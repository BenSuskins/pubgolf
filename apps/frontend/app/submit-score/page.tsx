'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { submitScore, getPenaltyOptions, PenaltyOption, getRoutes, getGameState } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { PenaltyType, PENALTY_EMOJI_MAP } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Counter } from '@/components/ui/Counter';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

export default function SubmitScorePage() {
  const [hole, setHole] = useState(1);
  const [score, setScore] = useState(0);
  const [penaltyType, setPenaltyType] = useState<PenaltyType | null>(null);
  const [penaltyOptions, setPenaltyOptions] = useState<PenaltyOption[]>([]);
  const [pars, setPars] = useState<number[]>([]);
  const [playerScores, setPlayerScores] = useState<(number | null)[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
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
    const fetchData = async () => {
      const gameCode = getGameCode();
      const playerId = getPlayerId();

      if (!gameCode || !playerId) return;

      try {
        // Fetch penalty options, routes, and game state in parallel
        const [penaltiesResponse, routesResponse, gameState] = await Promise.all([
          getPenaltyOptions(),
          getRoutes(),
          getGameState(gameCode),
        ]);

        setPenaltyOptions(penaltiesResponse.penalties);
        setPars(routesResponse.holes.map((h) => h.par));

        // Find current player's scores
        const currentPlayer = gameState.players.find((p) => p.id === playerId);
        if (currentPlayer) {
          setPlayerScores(currentPlayer.scores);

          // Find first null score (next uncompleted hole)
          const nextHoleIndex = currentPlayer.scores.findIndex((s) => s === null);
          if (nextHoleIndex !== -1) {
            setHole(nextHoleIndex + 1); // Holes are 1-indexed
          }
        }
      } catch (err) {
        // Silently fail for non-critical data
        console.error('Failed to fetch data:', err);
      }
    };

    fetchData();
  }, [getGameCode, getPlayerId]);

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

    setSubmitting(true);
    try {
      await submitScore(gameCode, playerId, hole, scoreNum, penaltyType);

      // Show success toast
      toast.success('Score submitted!', {
        description: `Hole ${hole}: ${scoreNum} sip${scoreNum !== 1 ? 's' : ''}`,
        duration: 2000,
      });

      // Redirect immediately - WebSocket will update the scoreboard
      router.push('/game');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit score');
      setSubmitting(false);
    }
  };

  const togglePenalty = (type: PenaltyType) => {
    setPenaltyType(penaltyType === type ? null : type);
  };

  const selectedPenalty = penaltyOptions.find((p) => p.type === penaltyType);
  const currentPar = pars[hole - 1];
  const completedCount = playerScores.filter((s) => s !== null).length;

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
          <div>
            <Select
              label="Hole"
              value={hole}
              onChange={(e) => setHole(parseInt(e.target.value, 10))}
              options={[1, 2, 3, 4, 5, 6, 7, 8, 9].map((h) => ({
                value: h,
                label: `Hole ${h}`,
              }))}
              disabled={submitting}
              fullWidth
            />
          </div>

          <Counter
            label="Sips Taken"
            value={penaltyType && selectedPenalty ? selectedPenalty.points : score}
            onChange={setScore}
            min={-10}
            max={10}
            disabled={submitting || !!penaltyType}
            ariaLabel="Sips counter"
            centerControls
          />

          {currentPar !== undefined && !penaltyType && score !== 0 && (
            <div className="text-center">
              {score === currentPar ? (
                <p className="text-sm text-[var(--color-text-secondary)]">
                  On par
                </p>
              ) : score < currentPar ? (
                <p className="text-sm text-[var(--color-success)] font-medium">
                  {currentPar - score} under par ⬇️
                </p>
              ) : (
                <p className="text-sm text-[var(--color-danger)] font-medium">
                  {score - currentPar} over par ⬆️
                </p>
              )}
            </div>
          )}

          <fieldset>
            <legend className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]">
              Quick Actions
            </legend>
            {penaltyOptions.length === 0 && currentPar === undefined ? (
              <div className="py-2">
                <EmptyState
                  icon="✅"
                  description="No quick actions available"
                />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {currentPar !== undefined && (
                  <button
                    type="button"
                    onClick={() => setScore(currentPar)}
                    aria-label={`Set score to par (${currentPar} sips)`}
                    disabled={submitting || !!penaltyType}
                    className={`p-4 rounded-lg font-medium transition-all flex flex-col items-center gap-2 min-h-[100px] ${
                      score === currentPar && !penaltyType
                        ? 'bg-[var(--color-accent)]/20 ring-2 ring-[var(--color-accent)]'
                        : 'glass hover:bg-white/5 border border-[var(--color-accent)]/30'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className="text-3xl" aria-hidden="true">
                      ⛳
                    </span>
                    <span className="text-sm text-center leading-tight">Par</span>
                    <span className="text-lg font-bold">{currentPar}</span>
                  </button>
                )}
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
                    disabled={submitting}
                  >
                    <span className="text-3xl" aria-hidden="true">
                      {PENALTY_EMOJI_MAP[option.type as PenaltyType]}
                    </span>
                    <span className="text-sm text-center leading-tight">{option.name}</span>
                    <span className="text-lg font-bold">+{option.points}</span>
                  </button>
                ))}
              </div>
            )}
          </fieldset>

          {error && <ErrorMessage message={error} variant="inline" />}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 px-4 btn-gradient rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {submitting ? 'Logging...' : 'Log It'}
            </button>
            {!submitting && (
              <Link
                href="/game"
                className="flex-1 py-3 px-4 glass text-center font-medium rounded-lg hover:bg-white/5 transition-colors"
              >
                Back to Scoreboard
              </Link>
            )}
          </div>
          </Card>
        </form>
      </div>
    </main>
  );
}
