'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, EventPayload, EventEndPayload } from '@/lib/types';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://api.pubgolf.me';

interface WebSocketState {
  isConnected: boolean;
  gameState: GameState | null;
  activeEvent: EventPayload | null;
  gameEnded: boolean;
  lastEventEnd: EventEndPayload | null;
}

const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

export function useGameWebSocket(gameCode: string | null) {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    gameState: null,
    activeEvent: null,
    gameEnded: false,
    lastEventEnd: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearEventEnd = useCallback(() => {
    setState(s => ({ ...s, lastEventEnd: null }));
  }, []);

  useEffect(() => {
    if (!gameCode) return;

    const wsUrl = `${WS_BASE_URL}/ws/games/${gameCode}`;

    const connect = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setState(s => ({ ...s, isConnected: true }));
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = event => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        setState(s => ({ ...s, isConnected: false }));
        wsRef.current = null;
        scheduleReconnect();
      };

      ws.onerror = error => {
        console.error('WebSocket error:', error);
      };
    };

    const scheduleReconnect = () => {
      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        console.log('Max reconnect attempts reached');
        return;
      }

      const delay = Math.min(
        BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current),
        MAX_RECONNECT_DELAY
      );

      reconnectAttemptsRef.current++;

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    };

    const handleMessage = (message: { type: string; payload: unknown }) => {
      switch (message.type) {
        case 'GAME_STATE':
          setState(s => ({
            ...s,
            gameState: message.payload as GameState,
          }));
          break;

        case 'EVENT_START':
          setState(s => ({
            ...s,
            activeEvent: message.payload as EventPayload,
            lastEventEnd: null,
          }));
          break;

        case 'EVENT_END':
          setState(s => ({
            ...s,
            activeEvent: null,
            lastEventEnd: message.payload as EventEndPayload,
          }));
          break;

        case 'GAME_ENDED':
          setState(s => ({
            ...s,
            gameEnded: true,
            activeEvent: null,
          }));
          break;
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [gameCode]);

  return {
    ...state,
    clearEventEnd,
  };
}
