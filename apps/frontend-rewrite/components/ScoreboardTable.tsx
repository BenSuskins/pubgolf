'use client';

import { Player, PAR_VALUES } from '@/lib/types';

interface ScoreboardTableProps {
  players: Player[];
}

function getScoreColor(score: number | null, holeIndex: number): string {
  if (score === null) return '';
  const par = PAR_VALUES[holeIndex];
  if (score < par) return 'text-green-600 dark:text-green-400';
  if (score > par) return 'text-red-600 dark:text-red-400';
  return '';
}

export function ScoreboardTable({ players }: ScoreboardTableProps) {
  if (players.length === 0) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-8">
        No players yet. Share the game code to invite players!
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="sticky left-0 bg-white dark:bg-black px-3 py-2 text-left font-semibold">
              Player
            </th>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((hole) => (
              <th key={hole} className="px-3 py-2 text-center font-semibold min-w-[40px]">
                {hole}
              </th>
            ))}
            <th className="px-3 py-2 text-center font-semibold">Total</th>
          </tr>
          <tr className="border-b border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            <td className="sticky left-0 bg-white dark:bg-black px-3 py-1">Par</td>
            {PAR_VALUES.map((par, i) => (
              <td key={i} className="px-3 py-1 text-center">
                {par}
              </td>
            ))}
            <td className="px-3 py-1 text-center">{PAR_VALUES.reduce((a, b) => a + b, 0)}</td>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr
              key={player.id}
              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <td className="sticky left-0 bg-white dark:bg-black px-3 py-2 font-medium">
                {player.name}
              </td>
              {player.scores.map((score, i) => (
                <td
                  key={i}
                  className={`px-3 py-2 text-center ${getScoreColor(score, i)}`}
                >
                  {score ?? '-'}
                </td>
              ))}
              <td className="px-3 py-2 text-center font-semibold">{player.totalScore}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
