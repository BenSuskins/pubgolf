'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Player, PENALTY_EMOJI_MAP, PenaltyType } from '@/lib/types';
import { hasPlayedHole, parRelativeTotal, formatParRelative } from '@/lib/scoring';
import { CellState } from '@/hooks/useOptimisticGameState';
import { staggerContainerVariants, staggerItemVariants } from '@/lib/animations';

interface LeaderboardProps {
  players: Player[];
  pars: number[];
  currentPlayerId?: string;
  hostPlayerId?: string;
  cellStates?: Record<string, CellState>;
}

function parRelativeColor(parRelative: number, hasPlayed: boolean): string {
  if (!hasPlayed) return 'text-[var(--color-text-faint)]';
  if (parRelative > 0) return 'text-[var(--color-error)]';
  if (parRelative < 0) return 'text-[var(--color-success)]';
  return 'text-[var(--color-accent)]';
}

function scoreColor(score: number, par: number | undefined): string {
  if (par === undefined) return 'text-[var(--color-text)]';
  if (score < par) return 'text-[var(--color-success)]';
  if (score > par) return 'text-[var(--color-error)]';
  return 'text-[var(--color-text)]';
}

function playerRank(player: Player, players: Player[]): number {
  const distinctLowerScores = new Set(
    players.filter((p) => p.totalScore < player.totalScore).map((p) => p.totalScore)
  );
  return distinctLowerScores.size;
}

interface HoleStripProps {
  player: Player;
  pars: number[];
  cellStates: Record<string, CellState>;
}

function HoleStrip({ player, pars, cellStates }: HoleStripProps) {
  return (
    <div className="flex gap-1 mt-3 pt-3 border-t border-[var(--color-border-gold)]/40">
      {player.scores.map((score, holeIndex) => {
        const holeNumber = holeIndex + 1;
        const wildcard = player.randomise?.hole === holeNumber ? player.randomise : null;
        const penalty = player.penalties?.find((p) => p.hole === holeNumber);
        const cellState = cellStates[`${player.id}-${holeNumber}`];
        const cellStateClass = cellState && cellState !== 'normal' ? `cell-${cellState}` : '';

        const isPlayed = hasPlayedHole(score);

        return (
          <div key={holeNumber} className={`flex-1 text-center rounded ${cellStateClass}`}>
            <div className="text-[9px] text-[var(--color-text-faint)]">{holeNumber}</div>
            <div
              className={`font-display text-sm ${
                isPlayed ? scoreColor(score as number, pars[holeIndex]) : 'text-[var(--color-text-faint)]'
              }`}
            >
              {isPlayed ? score : '–'}
            </div>
            {penalty && (
              <div
                className="text-sm leading-none mt-0.5"
                role="img"
                aria-label={`${penalty.type} penalty on hole ${holeNumber}`}
                title={`${penalty.type} +${penalty.points}`}
              >
                {PENALTY_EMOJI_MAP[penalty.type as PenaltyType]}
              </div>
            )}
            {wildcard && (
              <div title={`Wildcard: ${wildcard.result}`}>
                <div className="text-sm leading-none mt-0.5" role="img" aria-label={`Wildcard: ${wildcard.result}`}>
                  🎲
                </div>
                <div className="text-[8px] text-[var(--color-accent)] leading-tight mt-0.5">
                  {wildcard.result}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Leaderboard({
  players,
  pars,
  currentPlayerId,
  hostPlayerId,
  cellStates = {},
}: LeaderboardProps) {
  const [expandedPlayerIds, setExpandedPlayerIds] = useState<Set<string>>(new Set());
  const [autoExpandedPlayerId, setAutoExpandedPlayerId] = useState<string | null>(null);

  if (currentPlayerId && autoExpandedPlayerId !== currentPlayerId) {
    setAutoExpandedPlayerId(currentPlayerId);
    if (expandedPlayerIds.size === 0) {
      setExpandedPlayerIds(new Set([currentPlayerId]));
    }
  }

  if (players.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-2xl mb-2" aria-hidden="true">🍻</p>
        <p className="text-[var(--color-text-secondary)]">
          No players yet. Rally your crew!
        </p>
      </div>
    );
  }

  const noHolesPlayedYet = players.every((player) =>
    player.scores.every((score) => !hasPlayedHole(score))
  );

  const rankedPlayers = [...players].sort((a, b) => a.totalScore - b.totalScore);

  const toggleExpanded = (playerId: string) => {
    setExpandedPlayerIds((previous) => {
      const next = new Set(previous);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  };

  return (
    <motion.ol
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className="space-y-2 list-none p-0 m-0"
      aria-label="Leaderboard"
    >
      {rankedPlayers.map((player) => {
        const rank = playerRank(player, players) + 1;
        const isLeader = rank === 1 && !noHolesPlayedYet;
        const isCurrentPlayer = player.id === currentPlayerId;
        const isHost = player.id === hostPlayerId;
        const isExpanded = expandedPlayerIds.has(player.id);
        const hasPlayed = player.scores.some((score) => hasPlayedHole(score));
        const parRelative = parRelativeTotal(player.scores, pars);

        return (
          <motion.li key={player.id} variants={staggerItemVariants} className="list-none">
            <div
              className={`rounded-[14px] px-3.5 py-3 ${
                isLeader ? 'surface-gold' : 'glass'
              } ${isCurrentPlayer ? 'ring-1 ring-[var(--color-primary)]/40' : ''}`}
            >
              <button
                type="button"
                onClick={() => toggleExpanded(player.id)}
                aria-expanded={isExpanded}
                className="w-full flex items-center gap-3 text-left"
              >
                <span
                  className={`w-5 font-display text-base ${
                    isLeader ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'
                  }`}
                >
                  {rank}
                </span>
                <span
                  className={`w-[34px] h-[34px] rounded-full flex items-center justify-center font-bold text-[13px] shrink-0 ${
                    isLeader
                      ? 'bg-[var(--color-primary)] text-[var(--color-ink)]'
                      : 'bg-[var(--color-border-subtle)] text-[var(--color-text)]'
                  }`}
                  aria-hidden="true"
                >
                  {player.name.charAt(0).toUpperCase()}
                </span>
                <span className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="font-semibold text-[14.5px] truncate" title={player.name}>
                    {player.name}
                  </span>
                  {isHost && (
                    <span className="text-sm shrink-0" role="img" aria-label="Game host" title="Host">
                      👑
                    </span>
                  )}
                </span>
                <span
                  className={`font-display text-[17px] ${parRelativeColor(parRelative, hasPlayed)}`}
                  aria-label={`Total score ${player.totalScore}, ${
                    hasPlayed ? formatParRelative(parRelative) : 'no holes played'
                  }`}
                >
                  {hasPlayed ? formatParRelative(parRelative) : '–'}
                </span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  className={`ml-1 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                >
                  <path d="M6 9l6 6 6-6" stroke="var(--color-text-secondary)" strokeWidth="2" />
                </svg>
              </button>
              {isExpanded && <HoleStrip player={player} pars={pars} cellStates={cellStates} />}
            </div>
          </motion.li>
        );
      })}
    </motion.ol>
  );
}
