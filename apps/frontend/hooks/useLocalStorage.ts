'use client';

import { useCallback } from 'react';

export const STORAGE_KEYS = {
  GAME_CODE: 'gameCode',
  PLAYER_ID: 'playerId',
} as const;

// Written by older sessions; cleared on sign-out but no longer read or set.
const LEGACY_PLAYER_NAME_KEY = 'playerName';

export function useLocalStorage() {
  const getGameCode = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.GAME_CODE);
  }, []);

  const getPlayerId = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.PLAYER_ID);
  }, []);

  const setGameSession = useCallback(
    (gameCode: string, playerId: string) => {
      if (typeof window === 'undefined') return;
      localStorage.setItem(STORAGE_KEYS.GAME_CODE, gameCode);
      localStorage.setItem(STORAGE_KEYS.PLAYER_ID, playerId);
    },
    []
  );

  const clearSession = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.GAME_CODE);
    localStorage.removeItem(STORAGE_KEYS.PLAYER_ID);
    localStorage.removeItem(LEGACY_PLAYER_NAME_KEY);
  }, []);

  return {
    getGameCode,
    getPlayerId,
    setGameSession,
    clearSession,
  };
}
