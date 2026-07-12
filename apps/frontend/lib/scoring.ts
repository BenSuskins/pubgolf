// The backend returns null for holes that have not been played; 0 is a real score.
export function hasPlayedHole(score: number | null): boolean {
  return score !== null;
}

// Prefers the server-computed value; falls back to computing from scores and pars.
export function playerParRelative(
  player: { parRelative?: number; scores: (number | null)[] },
  pars: number[]
): number {
  return player.parRelative ?? parRelativeTotal(player.scores, pars);
}

export function parRelativeTotal(scores: (number | null)[], pars: number[]): number {
  return scores.reduce<number>((total, score, holeIndex) => {
    if (!hasPlayedHole(score) || pars[holeIndex] === undefined) return total;
    return total + ((score as number) - pars[holeIndex]);
  }, 0);
}

export function formatParRelative(parRelative: number): string {
  if (parRelative === 0) return 'E';
  return parRelative > 0 ? `+${parRelative}` : `−${Math.abs(parRelative)}`;
}

export function firstUnplayedHole(scores: (number | null)[], holeCount: number): number {
  const firstUnplayedIndex = scores.findIndex((score) => !hasPlayedHole(score));
  if (firstUnplayedIndex === -1) return holeCount;
  return firstUnplayedIndex + 1;
}
