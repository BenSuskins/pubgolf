'use client';

import { useEffect, useState } from 'react';
import { buildRules } from '@/lib/constants';
import { getPenaltyOptions, getRoutes, getGameState, PenaltyOption } from '@/lib/api';
import { PENALTY_EMOJI_MAP, PenaltyType, RouteHole } from '@/lib/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { BackButton } from './BackButton';
import { FREQUENTLY_ASKED_QUESTIONS } from './faq';
import { RoutesTable } from '@/components/RoutesTable';
import { Card } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';

function PenaltiesSkeleton() {
  return (
    <div className="flex flex-wrap gap-3" role="status" aria-label="Loading penalties">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="h-10 w-32 rounded-lg bg-[var(--color-border)] animate-pulse"
        />
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

export default function HowToPlayPage() {
  const [penalties, setPenalties] = useState<PenaltyOption[]>([]);
  const [holes, setHoles] = useState<RouteHole[]>([]);
  const [isPenaltiesLoading, setIsPenaltiesLoading] = useState(true);
  const [isRoutesLoading, setIsRoutesLoading] = useState(true);
  const [penaltiesError, setPenaltiesError] = useState(false);
  const [routesError, setRoutesError] = useState(false);
  const { getGameCode } = useLocalStorage();

  // Route names come from the course itself, so the rules name the host's
  // routes. Before the course loads this falls back to generic wording.
  const rules = buildRules(holes.length > 0 ? Object.keys(holes[0].drinks) : []);

  useEffect(() => {
    getPenaltyOptions()
      .then((response) => setPenalties(response.penalties))
      .catch(() => setPenaltiesError(true))
      .finally(() => setIsPenaltiesLoading(false));

    // In a game, show that game's course (the host can have customised it);
    // otherwise fall back to the default course.
    const gameCode = getGameCode();
    const course = gameCode
      ? getGameState(gameCode).then((state) => state.holes)
      : getRoutes().then((response) => response.holes);

    course
      .then(setHoles)
      .catch(() => setRoutesError(true))
      .finally(() => setIsRoutesLoading(false));
  }, [getGameCode]);

  return (
    <main className="p-5 py-6">
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <BackButton />
        </div>
        <div className="text-center">
          <Typography variant="display" className="mb-3 text-4xl">
            How to Play Pub Golf
          </Typography>
          <Typography as="p" color="secondary" className="max-w-md mx-auto text-[13.5px] leading-relaxed">
            Pub golf turns your pub crawl into a round of golf: every pub is a hole with a
            set drink and a par. Drink at each hole, match or beat the par in sips. Lowest
            score wins. Simple.
          </Typography>
        </div>

        <Card as="section" padding="lg" rounded="lg">
          <h2 className="text-[var(--color-text)] font-bold text-[15px] mb-3.5">How It Works</h2>
          <ol className="space-y-3 mb-6">
            {rules.map((rule, index) => (
              <li key={index} className="flex gap-2.5 text-[13.5px] leading-normal text-[var(--color-text-secondary)]">
                <span className="font-display text-sm text-[var(--color-primary)]">{index + 1}</span>
                <span>{rule}</span>
              </li>
            ))}
          </ol>

          <h3 className="text-[var(--color-error)] font-bold text-sm mb-2.5">Penalties</h3>
          {isPenaltiesLoading ? (
            <PenaltiesSkeleton />
          ) : penaltiesError ? (
            <p className="text-sm text-[var(--color-text-secondary)]">Penalty data unavailable — check your connection.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {penalties.map((penalty) => (
                <div
                  key={penalty.type}
                  className="flex items-center justify-between surface-danger rounded-xl px-3.5 py-3 text-sm"
                >
                  <span className="text-[var(--color-danger-text)] text-[13.5px]">
                    <span className="mr-2" role="img" aria-hidden="true">
                      {PENALTY_EMOJI_MAP[penalty.type as PenaltyType]}
                    </span>
                    {penalty.name}
                  </span>
                  <span className="font-display text-[15px] text-[var(--color-error)]">+{penalty.points}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card as="section" padding="lg" rounded="lg">
          <h2 className="text-[var(--color-text)] font-bold text-[15px] mb-3">The Course</h2>
          {isRoutesLoading ? (
            <RoutesTableSkeleton />
          ) : routesError ? (
            <p className="text-sm text-[var(--color-text-secondary)]">Course data unavailable — check your connection.</p>
          ) : (
            <RoutesTable holes={holes} />
          )}
        </Card>

        <Card as="section" padding="lg" rounded="lg">
          <h2 className="text-[var(--color-text)] font-bold text-[15px] mb-3.5">
            Pub Golf FAQ
          </h2>
          <dl className="space-y-4">
            {FREQUENTLY_ASKED_QUESTIONS.map((faq) => (
              <div key={faq.question}>
                <dt className="text-[var(--color-text)] font-bold text-[13.5px] mb-1">
                  {faq.question}
                </dt>
                <dd className="text-[13.5px] leading-relaxed text-[var(--color-text-secondary)]">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </Card>

      </div>
    </main>
  );
}
