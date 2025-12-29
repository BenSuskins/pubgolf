'use client';

import { Player, PAR_VALUES, PENALTY_EMOJI_MAP, PenaltyType } from '@/lib/types';

interface ScoreboardTableProps {
  players: Player[];
  currentPlayerId?: string;
  hostPlayerId?: string;
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

export function ScoreboardTable({ players, currentPlayerId, hostPlayerId }: ScoreboardTableProps) {
  if (players.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-2xl mb-2">🍻</p>
        <p className="text-[var(--color-text-secondary)]">
          No players yet. Rally your crew!
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full border-collapse text-sm" role="table" aria-label="Player scores">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <th scope="col" className="sticky left-0 z-10 bg-[var(--color-surface)] px-3 py-3 text-left font-semibold text-[var(--color-text-secondary)]">
              Player
            </th>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((hole) => (
              <th scope="col" key={hole} className="px-3 py-3 text-center font-semibold min-w-[44px] text-[var(--color-text-secondary)]">
                {hole}
              </th>
            ))}
            <th scope="col" className="px-3 py-3 text-center font-semibold text-[var(--color-accent)]">Total</th>
          </tr>
          <tr className="border-b border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]/60">
            <td className="sticky left-0 z-10 bg-[var(--color-surface)] px-3 py-1.5">Par</td>
            {PAR_VALUES.map((par, i) => (
              <td key={i} className="px-3 py-1.5 text-center">
                {par}
              </td>
            ))}
            <td className="px-3 py-1.5 text-center">{PAR_VALUES.reduce((a, b) => a + b, 0)}</td>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => {
            const isCurrentPlayer = player.id === currentPlayerId;
            const isHost = player.id === hostPlayerId;
            const rank = getPlayerRank(player, players);
            const medal = getMedal(rank);
            const isLeader = rank === 0;

            return (
              <tr
                key={player.id}
                className={`border-b border-[var(--color-border-subtle)] transition-colors duration-150 ${
                  isCurrentPlayer
                    ? 'bg-[var(--color-primary)]/10'
                    : 'hover:bg-white/5'
                }`}
              >
                <th
                  scope="row"
                  className={`sticky left-0 z-10 px-3 py-3 font-medium text-left bg-[var(--color-surface)] relative ${
                    isCurrentPlayer
                      ? 'border-l-2 border-l-[var(--color-primary)]'
                      : ''
                  }`}
                >
                  {isCurrentPlayer && (
                    <div className="absolute inset-0 bg-[var(--color-primary)]/10 pointer-events-none" />
                  )}
                  <div className="flex items-center gap-2">
                    {medal && (
                      <span className={`text-lg ${isLeader ? 'animate-pulse' : ''}`}>{medal}</span>
                    )}
                    {isHost && (
                      <span className="text-lg" title="Host">👑</span>
                    )}
                    <span className="max-w-[100px] truncate" title={player.name}>
                      {player.name}
                    </span>
                  </div>
                </th>
                {player.scores.map((score, i) => {
                  const isRandomiseHole = player.randomise && player.randomise.hole === i + 1;
                  const penalty = player.penalties?.find((p) => p.hole === i + 1);
                  return (
                    <td
                      key={i}
                      className={`px-3 py-3 text-center ${getScoreColor(score, i)}`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="font-medium">{score ?? '-'}</span>
                        {isRandomiseHole && (
                          <span className="text-[10px] text-[var(--color-accent)] font-medium">
                            {player.randomise!.result}
                          </span>
                        )}
                        {penalty && (
                          <span className="text-[10px]" title={penalty.type}>
                            {PENALTY_EMOJI_MAP[penalty.type as PenaltyType]}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
                <td className={`px-3 py-3 text-center font-bold ${isLeader ? 'text-[var(--color-accent)]' : ''}`}>
                  {player.totalScore}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
