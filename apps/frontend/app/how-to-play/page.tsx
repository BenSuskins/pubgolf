'use client';

import { useRouter } from 'next/navigation';
import { RULES, PENALTIES, DRINKS } from '@/lib/constants';

export default function HowToPlayPage() {
  const router = useRouter();
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
            {PENALTIES.map((penalty, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-error-bg)] text-sm"
              >
                <span>{penalty.emoji}</span>
                <span className="text-[var(--color-text-secondary)]">{penalty.name}</span>
                <span className="text-[var(--color-error)] font-bold">{penalty.points}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="glass rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 font-[family-name:var(--font-display)] flex items-center gap-2">
            The Course
          </h2>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="px-3 py-3 text-left font-semibold text-[var(--color-text-secondary)]">Hole</th>
                  <th className="px-3 py-3 text-left font-semibold text-[var(--color-text-secondary)]">Route A</th>
                  <th className="px-3 py-3 text-left font-semibold text-[var(--color-text-secondary)]">Route B</th>
                  <th className="px-3 py-3 text-center font-semibold text-[var(--color-accent)]">Par</th>
                </tr>
              </thead>
              <tbody>
                {DRINKS.map((drink, index) => (
                  <tr
                    key={index}
                    className="border-b border-[var(--color-border-subtle)] hover:bg-white/5 transition-colors"
                  >
                    <td className="px-3 py-3 font-bold text-[var(--color-accent)]">{index + 1}</td>
                    <td className="px-3 py-3">{drink.drinkA}</td>
                    <td className="px-3 py-3">{drink.drinkB}</td>
                    <td className="px-3 py-3 text-center font-medium">{drink.par}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex justify-center">
          <button
            onClick={() => router.back()}
            className="py-3 px-8 glass rounded-lg hover:bg-white/5 transition-colors font-medium"
          >
            Got It
          </button>
        </div>
      </div>
    </main>
  );
}
