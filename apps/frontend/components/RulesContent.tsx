'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPenaltyOptions, getRoutes, getGameState, PenaltyOption } from '@/lib/api';
import { RouteHole } from '@/lib/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { BackButton } from '@/app/how-to-play/BackButton';
import { RoutesTable } from '@/components/RoutesTable';
import { Card } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { RulesList, PenaltiesList } from '@/components/RulesDetails';

function PenaltiesSkeleton() {
  return (
    <div className="flex flex-wrap gap-3" role="status" aria-label="Loading penalties">
      {[1, 2].map((i) => (
        <div key={i} className="h-10 w-32 rounded-lg bg-[var(--color-border)] animate-pulse" />
      ))}
    </div>
  );
}

function RoutesTableSkeleton() {
  return (
    <div className="overflow-x-auto -mx-2" role="status" aria-label="Loading course information">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <th className="px-3 py-3 text-left">
              <div className="h-4 w-12 bg-[var(--color-border)] rounded animate-pulse" />
            </th>
            <th className="px-3 py-3 text-left">
              <div className="h-4 w-20 bg-[var(--color-border)] rounded animate-pulse" />
            </th>
            <th className="px-3 py-3 text-left">
              <div className="h-4 w-20 bg-[var(--color-border)] rounded animate-pulse" />
            </th>
            <th className="px-3 py-3 text-center">
              <div className="h-4 w-8 bg-[var(--color-border)] rounded animate-pulse mx-auto" />
            </th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <tr key={i} className="border-b border-[var(--color-border-subtle)]">
              <td className="px-3 py-3">
                <div className="h-4 w-4 bg-[var(--color-border)] rounded animate-pulse" />
              </td>
              <td className="px-3 py-3">
                <div className="h-4 w-24 bg-[var(--color-border)] rounded animate-pulse" />
              </td>
              <td className="px-3 py-3">
                <div className="h-4 w-24 bg-[var(--color-border)] rounded animate-pulse" />
              </td>
              <td className="px-3 py-3">
                <div className="h-4 w-6 bg-[var(--color-border)] rounded animate-pulse mx-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RulesContent({ fromGame = false }: { fromGame?: boolean }) {
  const [penalties, setPenalties] = useState<PenaltyOption[]>([]);
  const [holes, setHoles] = useState<RouteHole[]>([]);
  const [isPenaltiesLoading, setIsPenaltiesLoading] = useState(true);
  const [isRoutesLoading, setIsRoutesLoading] = useState(true);
  const [penaltiesError, setPenaltiesError] = useState(false);
  const [routesError, setRoutesError] = useState(false);
  const { getGameCode } = useLocalStorage();

  useEffect(() => {
    getPenaltyOptions()
      .then((response) => setPenalties(response.penalties))
      .catch(() => setPenaltiesError(true))
      .finally(() => setIsPenaltiesLoading(false));

    const gameCode = fromGame ? getGameCode() : null;
    const course = gameCode
      ? getGameState(gameCode).then((state) => state.holes)
      : getRoutes().then((response) => response.holes);

    course
      .then(setHoles)
      .catch(() => setRoutesError(true))
      .finally(() => setIsRoutesLoading(false));
  }, [getGameCode, fromGame]);

  return (
    <main className="page-container py-6 md:py-10">
      <div className="rules-grid grid gap-6">
        <div className="lg:col-span-2">
          <BackButton fromGame={fromGame} />
        </div>
        <div className="lg:col-span-2">
          <Typography variant="display" className="mb-3 text-4xl">
            {fromGame ? 'Round Rules' : 'How to Play Pub Golf'}
          </Typography>
          {!fromGame && (
            <Typography as="p" color="secondary" className="max-w-2xl text-base leading-relaxed">
              Pub golf turns your pub crawl into a round of golf: every pub is a hole with a set
              drink and a par. Drink at each hole, match or beat the par in sips. Lowest score wins.
              Simple.
            </Typography>
          )}
        </div>

        <Card as="section" padding="lg" rounded="lg" className="min-w-0">
          <h2 className="text-[var(--color-text)] font-bold text-[15px] mb-3.5">How It Works</h2>
          <RulesList holes={holes} />

          <h3 className="text-[var(--color-error)] font-bold text-sm mb-2.5">Penalties</h3>
          {isPenaltiesLoading ? (
            <PenaltiesSkeleton />
          ) : penaltiesError ? (
            <p className="text-sm text-[var(--color-text-secondary)]">
              Penalty data unavailable — check your connection.
            </p>
          ) : (
            <PenaltiesList penalties={penalties} />
          )}
        </Card>

        <Card as="section" padding="lg" rounded="lg" className="min-w-0">
          <h2 className="text-[var(--color-text)] font-bold text-[15px] mb-3">The Course</h2>
          {isRoutesLoading ? (
            <RoutesTableSkeleton />
          ) : routesError ? (
            <p className="text-sm text-[var(--color-text-secondary)]">
              Course data unavailable — check your connection.
            </p>
          ) : (
            <RoutesTable holes={holes} />
          )}
        </Card>

        {!fromGame && (
          <section className="lg:col-span-2 flex flex-wrap items-center justify-between gap-4 glass rounded-2xl p-6">
            <div>
              <h2 className="font-display text-2xl">Ready for your round?</h2>
              <p className="mt-2 text-[var(--color-text-secondary)]">
                Host a game, share the code, and record scores from your own phones. No account or
                download needed.
              </p>
            </div>
            <Link
              href="/play?mode=host"
              className="btn-gradient inline-flex min-h-12 items-center rounded-xl px-6 py-3"
            >
              Host a round →
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
