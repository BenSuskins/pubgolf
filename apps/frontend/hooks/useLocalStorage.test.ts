import { describe, test, expect, beforeEach } from 'bun:test';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('getGameCode', () => {
    test('should return null when no game code stored', () => {
      const { result } = renderHook(() => useLocalStorage());
      expect(result.current.getGameCode()).toBeNull();
    });

    test('should return stored game code', () => {
      window.localStorage.setItem('gameCode', 'ABCD');
      const { result } = renderHook(() => useLocalStorage());
      expect(result.current.getGameCode()).toBe('ABCD');
    });
  });

  describe('getPlayerId', () => {
    test('should return null when no player ID stored', () => {
      const { result } = renderHook(() => useLocalStorage());
      expect(result.current.getPlayerId()).toBeNull();
    });

    test('should return stored player ID', () => {
      window.localStorage.setItem('playerId', 'player-123');
      const { result } = renderHook(() => useLocalStorage());
      expect(result.current.getPlayerId()).toBe('player-123');
    });
  });

  describe('getPlayerName', () => {
    test('should return null when no player name stored', () => {
      const { result } = renderHook(() => useLocalStorage());
      expect(result.current.getPlayerName()).toBeNull();
    });

    test('should return stored player name', () => {
      window.localStorage.setItem('playerName', 'John Doe');
      const { result } = renderHook(() => useLocalStorage());
      expect(result.current.getPlayerName()).toBe('John Doe');
    });
  });

  describe('setGameSession', () => {
    test('should store gameCode, playerId, and playerName', () => {
      const { result } = renderHook(() => useLocalStorage());

      act(() => {
        result.current.setGameSession('WXYZ', 'player-456', 'Jane Doe');
      });

      expect(window.localStorage.getItem('gameCode')).toBe('WXYZ');
      expect(window.localStorage.getItem('playerId')).toBe('player-456');
      expect(window.localStorage.getItem('playerName')).toBe('Jane Doe');
    });

    test('should overwrite existing values', () => {
      window.localStorage.setItem('gameCode', 'OLD');
      window.localStorage.setItem('playerId', 'old-player');
      window.localStorage.setItem('playerName', 'Old Name');

      const { result } = renderHook(() => useLocalStorage());

      act(() => {
        result.current.setGameSession('NEW', 'new-player', 'New Name');
      });

      expect(window.localStorage.getItem('gameCode')).toBe('NEW');
      expect(window.localStorage.getItem('playerId')).toBe('new-player');
      expect(window.localStorage.getItem('playerName')).toBe('New Name');
    });
  });

  describe('clearSession', () => {
    test('should remove all session data from localStorage', () => {
      window.localStorage.setItem('gameCode', 'ABCD');
      window.localStorage.setItem('playerId', 'player-123');
      window.localStorage.setItem('playerName', 'Jane Doe');

      const { result } = renderHook(() => useLocalStorage());

      act(() => {
        result.current.clearSession();
      });

      expect(window.localStorage.getItem('gameCode')).toBeNull();
      expect(window.localStorage.getItem('playerId')).toBeNull();
      expect(window.localStorage.getItem('playerName')).toBeNull();
    });

    test('should not throw if already cleared', () => {
      const { result } = renderHook(() => useLocalStorage());

      expect(() => {
        act(() => {
          result.current.clearSession();
        });
      }).not.toThrow();
    });
  });

  describe('function stability', () => {
    test('should return stable function references (memoization)', () => {
      const { result, rerender } = renderHook(() => useLocalStorage());

      const firstRender = {
        getGameCode: result.current.getGameCode,
        getPlayerId: result.current.getPlayerId,
        getPlayerName: result.current.getPlayerName,
        setGameSession: result.current.setGameSession,
        clearSession: result.current.clearSession,
      };

      rerender();

      expect(result.current.getGameCode).toBe(firstRender.getGameCode);
      expect(result.current.getPlayerId).toBe(firstRender.getPlayerId);
      expect(result.current.getPlayerName).toBe(firstRender.getPlayerName);
      expect(result.current.setGameSession).toBe(firstRender.setGameSession);
      expect(result.current.clearSession).toBe(firstRender.clearSession);
    });
  });
});
