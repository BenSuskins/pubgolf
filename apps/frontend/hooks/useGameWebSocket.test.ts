import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test';
import { renderHook, waitFor } from '@testing-library/react';

let mockActivate: ReturnType<typeof mock>;
let mockDeactivate: ReturnType<typeof mock>;
let mockSubscribe: ReturnType<typeof mock>;
let onConnectCallback: (() => void) | null = null;
let onWebSocketCloseCallback: (() => void) | null = null;

mock.module('@stomp/stompjs', () => {
  mockActivate = mock(() => {});
  mockDeactivate = mock(() => {});
  mockSubscribe = mock(() => ({ unsubscribe: () => {} }));

  return {
    Client: class MockClient {
      active = false;

      constructor(config: {
        onConnect?: () => void;
        onWebSocketClose?: () => void;
      }) {
        onConnectCallback = config.onConnect || null;
        onWebSocketCloseCallback = config.onWebSocketClose || null;
      }

      activate() {
        mockActivate();
        this.active = true;
      }

      deactivate() {
        mockDeactivate();
        this.active = false;
      }

      subscribe(destination: string, callback: (message: { body: string }) => void) {
        return mockSubscribe(destination, callback);
      }
    },
  };
});

mock.module('sockjs-client', () => ({
  default: class MockSockJS {
    constructor(_url: string) {}
  },
}));

import { useGameWebSocket } from './useGameWebSocket';

describe('useGameWebSocket', () => {
  const mockOnGameStateUpdate = mock(() => {});

  beforeEach(() => {
    mockActivate?.mockClear?.();
    mockDeactivate?.mockClear?.();
    mockSubscribe?.mockClear?.();
    mockOnGameStateUpdate.mockClear();
    onConnectCallback = null;
    onWebSocketCloseCallback = null;
  });

  afterEach(() => {
    onConnectCallback = null;
    onWebSocketCloseCallback = null;
  });

  test('does not connect when gameCode is null', () => {
    renderHook(() =>
      useGameWebSocket({
        gameCode: null,
        onGameStateUpdate: mockOnGameStateUpdate,
      })
    );

    expect(mockActivate).not.toHaveBeenCalled();
  });

  test('does not connect when disabled', () => {
    renderHook(() =>
      useGameWebSocket({
        gameCode: 'ABC123',
        onGameStateUpdate: mockOnGameStateUpdate,
        enabled: false,
      })
    );

    expect(mockActivate).not.toHaveBeenCalled();
  });

  test('connects when gameCode is provided and enabled', async () => {
    renderHook(() =>
      useGameWebSocket({
        gameCode: 'ABC123',
        onGameStateUpdate: mockOnGameStateUpdate,
      })
    );

    await waitFor(() => {
      expect(mockActivate).toHaveBeenCalled();
    });
  });

  test('deactivates on unmount', async () => {
    const { unmount } = renderHook(() =>
      useGameWebSocket({
        gameCode: 'ABC123',
        onGameStateUpdate: mockOnGameStateUpdate,
      })
    );

    await waitFor(() => expect(mockActivate).toHaveBeenCalled());

    unmount();

    expect(mockDeactivate).toHaveBeenCalled();
  });

  test('starts with isConnected false', () => {
    const { result } = renderHook(() =>
      useGameWebSocket({
        gameCode: 'ABC123',
        onGameStateUpdate: mockOnGameStateUpdate,
      })
    );

    expect(result.current.isConnected).toBe(false);
  });

  test('starts with no connection error', () => {
    const { result } = renderHook(() =>
      useGameWebSocket({
        gameCode: 'ABC123',
        onGameStateUpdate: mockOnGameStateUpdate,
      })
    );

    expect(result.current.connectionError).toBeNull();
  });
});
