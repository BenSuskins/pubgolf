'use client';

import { useCallback } from 'react';

const KEYS = {
  GAME_CODE: 'gameCode',
  PLAYER_ID: 'playerId',
  PLAYER_NAME: 'playerName',
} as const;

export function useLocalStorage() {
  const getGameCode = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(KEYS.GAME_CODE);
  }, []);

  const getPlayerId = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(KEYS.PLAYER_ID);
  }, []);

  const getPlayerName = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(KEYS.PLAYER_NAME);
  }, []);

  const setGameSession = useCallback(
    (gameCode: string, playerId: string, playerName: string) => {
      if (typeof window === 'undefined') return;
      localStorage.setItem(KEYS.GAME_CODE, gameCode);
      localStorage.setItem(KEYS.PLAYER_ID, playerId);
      localStorage.setItem(KEYS.PLAYER_NAME, playerName);
    },
    []
  );

  const clearSession = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(KEYS.GAME_CODE);
    localStorage.removeItem(KEYS.PLAYER_ID);
    localStorage.removeItem(KEYS.PLAYER_NAME);
  }, []);

  return {
    getGameCode,
    getPlayerId,
    getPlayerName,
    setGameSession,
    clearSession,
  };
}
