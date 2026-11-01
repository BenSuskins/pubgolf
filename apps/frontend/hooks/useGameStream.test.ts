import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { act, renderHook } from '@testing-library/react';
import { useGameStream } from './useGameStream';
import { GameState } from '@/lib/types';

class EventSourceFake extends EventTarget {
  static connections: EventSourceFake[] = [];
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;
  constructor(public url: string) {
    super();
    EventSourceFake.connections.push(this);
  }
  close() { this.closed = true; }
  snapshot(value: unknown) {
    this.dispatchEvent(new MessageEvent('game-state', { data: JSON.stringify(value) }));
  }
}
const originalEventSource = globalThis.EventSource;
beforeEach(() => {
  EventSourceFake.connections = [];
  globalThis.EventSource = EventSourceFake as unknown as typeof EventSource;
});
afterEach(() => { globalThis.EventSource = originalEventSource; });

describe('useGameStream', () => {
  test('receives snapshots and reports reconnects', () => {
    const update = mock(() => {});
    const reconnect = mock(() => {});
    const { result, unmount } = renderHook(() => useGameStream({ gameCode: 'PAR001', onGameStateUpdate: update, onReconnect: reconnect }));
    const connection = EventSourceFake.connections[0];
    expect(connection.url).toEndWith('/api/v1/games/par001/stream');
    act(() => { connection.onopen?.(); });
    expect(result.current.isConnected).toBe(true);
    expect(reconnect).not.toHaveBeenCalled();
    const snapshot = { gameCode: 'PAR001', players: [] } as unknown as GameState;
    act(() => { connection.snapshot(snapshot); });
    expect(update).toHaveBeenCalledWith(snapshot);
    act(() => { connection.onerror?.(); });
    expect(result.current.isConnected).toBe(false);
    expect(result.current.connectionError).toContain('Reconnecting');
    act(() => { connection.onopen?.(); });
    expect(reconnect).toHaveBeenCalledTimes(1);
    unmount();
    expect(connection.closed).toBe(true);
  });
  test('replaces the connection when the game changes and ignores stale events', () => {
    const update = mock(() => {});
    const { rerender, unmount } = renderHook(({ gameCode }) => useGameStream({ gameCode, onGameStateUpdate: update }), { initialProps: { gameCode: 'PAR001' } });
    const first = EventSourceFake.connections[0];
    rerender({ gameCode: 'PAR002' });
    expect(first.closed).toBe(true);
    act(() => { first.snapshot({ gameCode: 'PAR001' }); });
    expect(update).not.toHaveBeenCalled();
    expect(EventSourceFake.connections[1].url).toEndWith('/api/v1/games/par002/stream');
    unmount();
  });
  test('does not connect without a game or while disabled', () => {
    const { rerender } = renderHook(({ gameCode, enabled }: { gameCode: string | null; enabled: boolean }) => useGameStream({ gameCode, enabled, onGameStateUpdate: () => {} }), { initialProps: { gameCode: null, enabled: true } });
    rerender({ gameCode: 'PAR001', enabled: false });
    expect(EventSourceFake.connections).toHaveLength(0);
  });
});
