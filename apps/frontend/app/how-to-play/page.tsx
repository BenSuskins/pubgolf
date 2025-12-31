import type { Metadata } from "next";
import { RULES } from '@/lib/constants';
import { getPenaltyOptions, getRoutes, PenaltyOption } from '@/lib/api';
import { PENALTY_EMOJI_MAP, PenaltyType, RouteHole } from '@/lib/types';
import { BackButton } from './BackButton';
import { RoutesTable } from '@/components/RoutesTable';

export const metadata: Metadata = {
  title: "How to Play Pub Golf - Rules & Scoring",
  description:
    "Learn the rules of Pub Golf. 9 holes, 9 drinks, beat the par at each stop. Complete guide to scoring, penalties, and the drink course.",
};

async function fetchPenalties(): Promise<PenaltyOption[]> {
  try {
    const response = await getPenaltyOptions();
    return response.penalties;
  } catch {
    return [];
  }
}

async function fetchRoutes(): Promise<RouteHole[]> {
  try {
    const response = await getRoutes();
    return response.holes;
  } catch {
    return [];
  }
}

export default async function HowToPlayPage() {
  const [penalties, holes] = await Promise.all([fetchPenalties(), fetchRoutes()]);

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
        </section>

        <section className="glass rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 font-[family-name:var(--font-display)] flex items-center gap-2">
            The Course
          </h2>
          <RoutesTable holes={holes} />
        </section>

        <div className="flex justify-center">
          <BackButton />
        </div>
      </div>
    </main>
  );
}
