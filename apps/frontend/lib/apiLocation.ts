export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pubgolf.me';

export function gamePath(gameCode: string, suffix: string = ''): string {
  return `/api/v1/games/${encodeURIComponent(gameCode)}${suffix}`;
}
