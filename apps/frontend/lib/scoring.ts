// The backend returns null for holes that have not been played; 0 is a real score.
export function hasPlayedHole(score: number | null): boolean {
  return score !== null;
}

export function formatParRelative(parRelative: number): string {
  if (parRelative === 0) return 'E';
  return parRelative > 0 ? `+${parRelative}` : `−${Math.abs(parRelative)}`;
}
