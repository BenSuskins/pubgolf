'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { submitScore, getPenaltyOptions, PenaltyOption, getRoutes, getGameState, getRoute } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { PenaltyType, PubLocation } from '@/lib/types';
import { firstUnplayedHole } from '@/lib/scoring';
import { Card } from '@/components/ui/Card';
import { Counter } from '@/components/ui/Counter';
import { HoleChips } from '@/components/HoleChips';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

export default function SubmitScorePage() {
  const [hole, setHole] = useState(1);
  const [score, setScore] = useState(0);
  const [penaltyType, setPenaltyType] = useState<PenaltyType | null>(null);
  const [penaltyOptions, setPenaltyOptions] = useState<PenaltyOption[]>([]);
  const [pars, setPars] = useState<number[]>([]);
  const [playerScores, setPlayerScores] = useState<(number | null)[]>([]);
  const [pubs, setPubs] = useState<PubLocation[]>([]);
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

      const [penaltiesResult, routesResult, gameStateResult, routeResult] = await Promise.allSettled([
        getPenaltyOptions(),
        getRoutes(),
        getGameState(gameCode),
        getRoute(gameCode),
      ]);

      if (penaltiesResult.status === 'fulfilled') {
        setPenaltyOptions(penaltiesResult.value.penalties);
      }
      if (routesResult.status === 'fulfilled') {
        setPars(routesResult.value.holes.map((h) => h.par));
      }
      if (routeResult.status === 'fulfilled') {
        setPubs(routeResult.value.pubs);
      }
      if (gameStateResult.status === 'fulfilled') {
        const currentPlayer = gameStateResult.value.players.find((p) => p.id === playerId);
        if (currentPlayer) {
          setPlayerScores(currentPlayer.scores);
          setHole(firstUnplayedHole(currentPlayer.scores, 9));
        }
      } else {
        console.error('Failed to load game state:', gameStateResult.reason);
        setError('Could not load your current scores — hole selection may be incorrect');
      }
    };

    fetchData();
  }, [getGameCode, getPlayerId]);

  const handleHoleSelect = (selectedHole: number) => {
    setHole(selectedHole);
    setScore(playerScores[selectedHole - 1] ?? 0);
    setPenaltyType(null);
  };

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
  const currentPubName = pubs.find((pub) => pub.hole === hole)?.name;
  const displayedScore = penaltyType && selectedPenalty ? selectedPenalty.points : score;

  const parReadout = () => {
    if (currentPar === undefined || penaltyType || score === 0) return null;
    if (score === currentPar) {
      return <p className="text-sm text-[var(--color-accent)]">On par</p>;
    }
    if (score < currentPar) {
      return (
        <p className="text-sm text-[var(--color-success)] font-medium">
          {currentPar - score} under par
        </p>
      );
    }
    return (
      <p className="text-sm text-[var(--color-error)] font-medium">
        {score - currentPar} over par
      </p>
    );
  };

  return (
    <main className="min-h-full flex flex-col p-5 max-w-md mx-auto w-full">
      <div className="space-y-5 flex-1 flex flex-col">
        <div>
          <Link
            href="/game"
            className="text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
          >
            ← Back to Scoreboard
          </Link>
          <h1 className="font-display text-2xl text-[var(--color-text)] mt-3">
            HOLE {hole}
            {currentPubName ? ` — ${currentPubName}` : ''}
          </h1>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
            {currentPar !== undefined ? `Par ${currentPar} · ` : ''}how many did it take?
          </p>
        </div>

        <HoleChips
          selectedHole={hole}
          scores={playerScores}
          pars={pars}
          onSelect={handleHoleSelect}
          disabled={submitting}
        />

        <form onSubmit={handleSubmit} className="space-y-5 flex-1 flex flex-col">
          <Card padding="lg" className="flex flex-col items-center">
            <Counter
              label="Sips Taken"
              value={displayedScore}
              onChange={setScore}
              min={-10}
              max={10}
              disabled={submitting || !!penaltyType}
              ariaLabel="Sips counter"
              centerControls
            />
            <div className="mt-4 text-center" aria-live="polite">
              {parReadout()}
            </div>
          </Card>

          <fieldset>
            <legend className="eyebrow block mb-2.5 text-[var(--color-text-muted)]">
              Quick Actions
            </legend>
            {penaltyOptions.length === 0 && currentPar === undefined ? (
              <div className="py-2">
                <EmptyState icon="✅" description="No quick actions available" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5">
                {currentPar !== undefined && (
                  <button
                    type="button"
                    onClick={() => setScore(currentPar)}
                    aria-label={`Set score to par (${currentPar} sips)`}
                    disabled={submitting || !!penaltyType}
                    className={`rounded-[14px] py-3.5 px-2 text-center transition-all ${
                      score === currentPar && !penaltyType
                        ? 'bg-[rgba(201,162,75,0.1)] border-[1.5px] border-[var(--color-accent)]'
                        : 'glass hover:bg-[var(--color-surface-hover)]'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className="font-display text-xl text-[var(--color-accent)] block">
                      {currentPar}
                    </span>
                    <span className="text-xs text-[var(--color-text-secondary)] block mt-1">Par</span>
                  </button>
                )}
                {penaltyOptions.map((option) => (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => togglePenalty(option.type as PenaltyType)}
                    aria-pressed={penaltyType === option.type}
                    disabled={submitting}
                    className={`rounded-[14px] py-3.5 px-2 text-center transition-all ${
                      penaltyType === option.type
                        ? 'surface-danger ring-1 ring-[var(--color-error)]'
                        : 'glass hover:bg-[var(--color-surface-hover)] border-[var(--color-danger-border-strong)]'
                    }`}
                  >
                    <span className="font-display text-xl text-[var(--color-error)] block">
                      +{option.points}
                    </span>
                    <span className="text-xs text-[var(--color-text-secondary)] block mt-1">
                      {option.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </fieldset>

          {error && <ErrorMessage message={error} variant="inline" />}

          <div className="flex-1" />

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-[19px] px-4 btn-gradient rounded-2xl text-[19px] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            {submitting ? 'LOGGING...' : 'LOG IT'}
          </button>
        </form>
      </div>
    </main>
  );
}
