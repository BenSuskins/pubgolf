'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { GameState } from '@/lib/types';

const WS_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pubgolf.me';
const RECONNECT_BASE_DELAY_MS = 5_000;

interface UseGameWebSocketOptions {
  gameCode: string | null;
  playerId: string | null;
  onGameStateUpdate: (state: GameState) => void;
  /** Called after the connection is re-established, so callers can refetch anything missed while offline. */
  onReconnect?: () => void;
  enabled?: boolean;
}

interface UseGameWebSocketResult {
  isConnected: boolean;
  connectionError: string | null;
}

export function useGameWebSocket({
  gameCode,
  playerId,
  onGameStateUpdate,
  onReconnect,
  enabled = true,
}: UseGameWebSocketOptions): UseGameWebSocketResult {
  const clientRef = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const hasConnectedBeforeRef = useRef(false);
  const onGameStateUpdateRef = useRef(onGameStateUpdate);
  const onReconnectRef = useRef(onReconnect);

  useEffect(() => {
    onGameStateUpdateRef.current = onGameStateUpdate;
    onReconnectRef.current = onReconnect;
  }, [onGameStateUpdate, onReconnect]);

  const connect = useCallback(() => {
    if (!gameCode || !enabled) return;

    const client = new Client({
      // Under `/api/v1` so it is routed by the same proxy rule as the REST API.
      webSocketFactory: () => new SockJS(`${WS_BASE_URL}/api/v1/ws`),
      connectHeaders: playerId ? { 'PubGolf-Player-Id': playerId } : {},
      reconnectDelay: RECONNECT_BASE_DELAY_MS,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setIsConnected(true);
        setConnectionError(null);

        // Broadcasts sent while offline are gone; refetch to resync.
        if (hasConnectedBeforeRef.current) {
          onReconnectRef.current?.();
        }
        hasConnectedBeforeRef.current = true;

        client.subscribe(
          `/topic/games/${gameCode.toLowerCase()}`,
          (message: IMessage) => {
            try {
              const gameState: GameState = JSON.parse(message.body);
              onGameStateUpdateRef.current(gameState);
            } catch (error) {
              console.error('Failed to parse game state:', error);
            }
          }
        );
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message']);
        setConnectionError(frame.headers['message'] || 'Connection error');
      },
      onWebSocketClose: () => {
        setIsConnected(false);
        // The client keeps reconnecting on its own; let the user know updates may lag.
        setConnectionError('Reconnecting — live updates may be delayed.');
      },
    });

    client.activate();
    clientRef.current = client;
  }, [gameCode, playerId, enabled]);

  useEffect(() => {
    connect();

    return () => {
      if (clientRef.current?.active) {
        clientRef.current.deactivate();
      }
    };
  }, [connect]);

  return { isConnected, connectionError };
}
