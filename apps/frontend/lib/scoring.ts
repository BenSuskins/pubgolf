// The backend initialises every hole to a score of 0 and never returns null,
// so a 0 is treated as "not played yet" for display purposes.
export function hasPlayedHole(score: number | null): boolean {
  return score !== null && score !== 0;
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
