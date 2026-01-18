'use client';

import { useEffect, useState } from 'react';
import { RULES } from '@/lib/constants';
import { getPenaltyOptions, getRoutes, PenaltyOption } from '@/lib/api';
import { PENALTY_EMOJI_MAP, PenaltyType, RouteHole } from '@/lib/types';
import { BackButton } from './BackButton';
import { RoutesTable } from '@/components/RoutesTable';

function PenaltiesSkeleton() {
  return (
    <div className="flex flex-wrap gap-3" role="status" aria-label="Loading penalties">
      {[1, 2, 3].map((i) => (
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
          {[1, 2, 3, 4, 5].map((i) => (
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

  useEffect(() => {
    getPenaltyOptions()
      .then((response) => setPenalties(response.penalties))
      .catch(() => setPenalties([]))
      .finally(() => setIsPenaltiesLoading(false));

    getRoutes()
      .then((response) => setHoles(response.holes))
      .catch(() => setHoles([]))
      .finally(() => setIsRoutesLoading(false));
  }, []);

  return (
    <main className="p-6 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-3 font-[family-name:var(--font-display)] gradient-text">
            The Rules
          </h1>
          <p className="text-[var(--color-text-secondary)] max-w-md mx-auto">
            Drink at each hole, match or beat the par. Lowest score wins. Simple.
          </p>
        </div>

        <section className="glass rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 font-[family-name:var(--font-display)] flex items-center gap-2">
            How It Works
          </h2>
          <ol className="space-y-3 mb-6">
            {RULES.map((rule, index) => (
              <li key={index} className="flex gap-3 text-[var(--color-text-secondary)]">
                <span className="text-[var(--color-accent)] font-bold font-mono">{index + 1}.</span>
                <span>{rule}</span>
              </li>
            ))}
          </ol>

          <h3 className="text-lg font-semibold mb-3 font-[family-name:var(--font-display)] text-[var(--color-error)]">
            Penalties
          </h3>
          {isPenaltiesLoading ? (
            <PenaltiesSkeleton />
          ) : (
            <div className="flex flex-wrap gap-3">
              {penalties.map((penalty) => (
                <div
                  key={penalty.type}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-error-bg)] text-sm"
                >
                  <span>{PENALTY_EMOJI_MAP[penalty.type as PenaltyType]}</span>
                  <span className="text-[var(--color-text-secondary)]">{penalty.name}</span>
                  <span className="text-[var(--color-error)] font-bold">+{penalty.points}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="glass rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 font-[family-name:var(--font-display)] flex items-center gap-2">
            The Course
          </h2>
          {isRoutesLoading ? (
            <RoutesTableSkeleton />
          ) : (
            <RoutesTable holes={holes} />
          )}
        </section>

        <div className="flex justify-center">
          <BackButton />
        </div>
      </div>
    </main>
  );
}
