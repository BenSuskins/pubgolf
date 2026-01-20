'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { GameState } from '@/lib/types';

const WS_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pubgolf.me';
const MAX_RECONNECT_ATTEMPTS = 5;

interface UseGameWebSocketOptions {
  gameCode: string | null;
  playerId: string | null;
  onGameStateUpdate: (state: GameState) => void;
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
  enabled = true,
}: UseGameWebSocketOptions): UseGameWebSocketResult {
  const clientRef = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const onGameStateUpdateRef = useRef(onGameStateUpdate);

  useEffect(() => {
    onGameStateUpdateRef.current = onGameStateUpdate;
  }, [onGameStateUpdate]);

  const connect = useCallback(() => {
    if (!gameCode || !enabled) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_BASE_URL}/ws`),
      connectHeaders: playerId ? { 'PubGolf-Player-Id': playerId } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;

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
        reconnectAttemptsRef.current += 1;
        if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setConnectionError('Unable to connect. Using polling fallback.');
        }
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
