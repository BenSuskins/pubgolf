'use client';

import { useCallback } from 'react';

export const STORAGE_KEYS = { GAME_CODE: 'gameCode', PLAYER_ID: 'playerId' } as const;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = document.cookie.split('; ').find((cookie) => cookie.startsWith(`${name}=`));
  if (!value) return null;
  try { return decodeURIComponent(value.slice(name.length + 1)) || null; } catch { return null; }
}

function writeCookie(name: string, value: string, maxAge: number): void {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function clearGameSession(): void {
  writeCookie(STORAGE_KEYS.GAME_CODE, '', 0);
  writeCookie(STORAGE_KEYS.PLAYER_ID, '', 0);
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.GAME_CODE);
    localStorage.removeItem(STORAGE_KEYS.PLAYER_ID);
    localStorage.removeItem('playerName');
  }
}

export function useLocalStorage() {
  const getGameCode = useCallback(() => readCookie(STORAGE_KEYS.GAME_CODE), []);
  const getPlayerId = useCallback(() => readCookie(STORAGE_KEYS.PLAYER_ID), []);
  const setGameSession = useCallback((gameCode: string, playerId: string) => {
    writeCookie(STORAGE_KEYS.GAME_CODE, gameCode, 60 * 60 * 24 * 365);
    writeCookie(STORAGE_KEYS.PLAYER_ID, playerId, 60 * 60 * 24 * 365);
  }, []);
  const clearSession = useCallback(() => clearGameSession(), []);
  return { getGameCode, getPlayerId, setGameSession, clearSession };
}
