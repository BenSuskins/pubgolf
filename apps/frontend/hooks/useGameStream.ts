'use client';

import { useEffect, useRef, useState } from 'react';
import { GameState } from '@/lib/types';
import { API_BASE_URL, gamePath } from '@/lib/apiLocation';

interface UseGameStreamOptions {
  gameCode: string | null;
  onGameStateUpdate: (state: GameState) => void;
  onReconnect?: () => void;
  enabled?: boolean;
}

export function useGameStream({
  gameCode,
  onGameStateUpdate,
  onReconnect,
  enabled = true,
}: UseGameStreamOptions) {
  const [connectedGame, setConnectedGame] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const updateRef = useRef(onGameStateUpdate);
  const reconnectRef = useRef(onReconnect);

  useEffect(() => {
    updateRef.current = onGameStateUpdate;
    reconnectRef.current = onReconnect;
  }, [onGameStateUpdate, onReconnect]);

  useEffect(() => {
    if (!gameCode || !enabled) return;

    let disposed = false;
    let hasConnected = false;
    const stream = new EventSource(
      `${API_BASE_URL}${gamePath(gameCode.toLowerCase(), '/stream')}`
    );
    stream.onopen = () => {
      if (disposed) return;
      setConnectedGame(gameCode);
      setConnectionError(null);
      if (hasConnected) reconnectRef.current?.();
      hasConnected = true;
    };
    stream.onerror = () => {
      if (disposed) return;
      setConnectedGame(null);
      setConnectionError('Reconnecting — live updates may be delayed.');
    };
    const receiveSnapshot = (event: Event) => {
      if (disposed) return;
      try {
        const state: GameState = JSON.parse((event as MessageEvent<string>).data);
        updateRef.current(state);
      } catch (error) {
        console.error('Failed to parse game state:', error);
      }
    };
    stream.addEventListener('game-state', receiveSnapshot);

    return () => {
      disposed = true;
      stream.removeEventListener('game-state', receiveSnapshot);
      stream.close();
    };
  }, [gameCode, enabled]);

  return { isConnected: enabled && !!gameCode && connectedGame === gameCode, connectionError: enabled && gameCode ? connectionError : null };
}
