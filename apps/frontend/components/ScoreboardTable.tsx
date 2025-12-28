'use client';

import { Player, PAR_VALUES } from '@/lib/types';

interface ScoreboardTableProps {
  players: Player[];
  currentPlayerId?: string;
}

function getScoreColor(score: number | null, holeIndex: number): string {
  if (score === null) return '';
  const par = PAR_VALUES[holeIndex];
  if (score < par) return 'text-[var(--color-success)]';
  if (score > par) return 'text-[var(--color-danger)]';
  return '';
}

function getMedal(rank: number): string {
  if (rank === 0) return '🥇';
  if (rank === 1) return '🥈';
  if (rank === 2) return '🥉';
  return '';
}

function getPlayerRank(player: Player, players: Player[]): number {
  const lowerScores = players
    .filter((p) => p.totalScore < player.totalScore)
    .map((p) => p.totalScore);
  const distinctLowerScores = new Set(lowerScores);
  return distinctLowerScores.size;
}

export function ScoreboardTable({ players, currentPlayerId }: ScoreboardTableProps) {
  if (players.length === 0) {
    return (
      <p className="text-center text-[var(--color-text-secondary)] py-8">
        No players yet. Share the game code to invite players!
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm" role="table" aria-label="Player scores">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <th scope="col" className="sticky left-0 z-10 bg-[var(--color-surface)] px-3 py-2 text-left font-semibold">
              Player
            </th>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((hole) => (
              <th scope="col" key={hole} className="px-3 py-2 text-center font-semibold min-w-[40px]">
                {hole}
              </th>
            ))}
            <th scope="col" className="px-3 py-2 text-center font-semibold">Total</th>
          </tr>
          <tr className="border-b border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">
            <td className="sticky left-0 z-10 bg-[var(--color-surface)] px-3 py-1">Par</td>
            {PAR_VALUES.map((par, i) => (
              <td key={i} className="px-3 py-1 text-center">
                {par}
              </td>
            ))}
            <td className="px-3 py-1 text-center">{PAR_VALUES.reduce((a, b) => a + b, 0)}</td>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => {
            const isCurrentPlayer = player.id === currentPlayerId;
            const rank = getPlayerRank(player, players);
            const medal = getMedal(rank);

            return (
              <tr
                key={player.id}
                className={`border-b border-[var(--color-border-subtle)] transition-colors duration-150 ${
                  isCurrentPlayer
                    ? 'bg-[var(--color-primary)]/10'
                    : 'hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                <th
                  scope="row"
                  className={`sticky left-0 z-10 px-3 py-2 font-medium text-left bg-[var(--color-surface)] ${
                    isCurrentPlayer ? 'border-l-2 border-l-[var(--color-primary)]' : ''
                  }`}
                >
                  <span className="max-w-[120px] truncate inline-block align-middle" title={player.name}>
                    {medal && <span className="mr-1">{medal}</span>}
                    {player.name}
                  </span>
                </th>
                {player.scores.map((score, i) => {
                  const isRandomiseHole = player.randomise && player.randomise.hole === i + 1;
                  return (
                    <td
                      key={i}
                      className={`px-3 py-2 text-center ${getScoreColor(score, i)}`}
                    >
                      <div className="flex flex-col items-center">
                        <span>{score ?? '-'}</span>
                        {isRandomiseHole && (
                          <span className="text-xs text-[var(--color-primary)]">
                            {player.randomise!.result}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-center font-semibold">{player.totalScore}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
