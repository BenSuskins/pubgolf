'use client';

import { useRouter } from 'next/navigation';
import { RULES, DRINKS } from '@/lib/constants';

export default function HowToPlayPage() {
  const router = useRouter();
  return (
    <main className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">How to Play</h1>
          <p className="text-[var(--color-text-secondary)]">
            Pub Golf is a fun game where players drink a designated drink at each stop
            and aim to match or beat the par score. The player with the lowest score wins!
          </p>
        </div>

        <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Rules</h2>
          <ol className="space-y-2 list-decimal list-inside">
            {RULES.map((rule, index) => (
              <li key={index} className="text-[var(--color-text-secondary)]">
                {rule}
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Drinks & Par Scores</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="px-3 py-2 text-left font-semibold">Hole</th>
                  <th className="px-3 py-2 text-left font-semibold">Drink A</th>
                  <th className="px-3 py-2 text-left font-semibold">Drink B</th>
                  <th className="px-3 py-2 text-center font-semibold">Par</th>
                </tr>
              </thead>
              <tbody>
                {DRINKS.map((drink, index) => (
                  <tr
                    key={index}
                    className="border-b border-[var(--color-border-subtle)]"
                  >
                    <td className="px-3 py-2 font-medium">{index + 1}</td>
                    <td className="px-3 py-2">{drink.drinkA}</td>
                    <td className="px-3 py-2">{drink.drinkB}</td>
                    <td className="px-3 py-2 text-center">{drink.par}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex justify-center">
          <button
            onClick={() => router.back()}
            className="py-2 px-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    </main>
  );
}
