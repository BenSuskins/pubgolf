import { describe, test, expect, beforeEach } from 'bun:test';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('guest session', () => {
  beforeEach(() => {
    document.cookie = 'gameCode=; Max-Age=0; Path=/';
    document.cookie = 'playerId=; Max-Age=0; Path=/';
    localStorage.clear();
  });

  test('stores, replaces and clears the round and player in cookies', () => {
    const { result } = renderHook(() => useLocalStorage());
    act(() => result.current.setGameSession('ABCD', 'player-1'));
    expect(document.cookie).toContain('gameCode=ABCD');
    expect(document.cookie).toContain('playerId=player-1');
    act(() => result.current.setGameSession('WXYZ', 'player-2'));
    expect(result.current.getGameCode()).toBe('WXYZ');
    expect(result.current.getPlayerId()).toBe('player-2');
    act(() => result.current.clearSession());
    expect(result.current.getGameCode()).toBeNull();
    expect(result.current.getPlayerId()).toBeNull();
  });

  test('does not restore old local storage sessions', () => {
    localStorage.setItem('gameCode', 'OLD');
    localStorage.setItem('playerId', 'old-player');
    const { result } = renderHook(() => useLocalStorage());
    expect(result.current.getGameCode()).toBeNull();
    expect(result.current.getPlayerId()).toBeNull();
  });
});
