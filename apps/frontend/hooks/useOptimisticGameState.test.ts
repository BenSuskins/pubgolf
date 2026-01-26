import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOptimisticGameState } from './useOptimisticGameState';
import { GameState } from '@/lib/types';
import { toast } from 'sonner';

// Mock sonner
mock.module('sonner', () => ({
  toast: {
    error: mock(() => {}),
    success: mock(() => {}),
  },
}));

describe('useOptimisticGameState', () => {
  let mockGameState: GameState;

  beforeEach(() => {
    mockGameState = {
      gameId: 'game-1',
      gameCode: 'ABCD',
      status: 'ACTIVE',
      hostPlayerId: 'player-1',
      players: [
        {
          id: 'player-1',
          name: 'Alice',
          scores: [null, null, null, null, null, null, null, null, null],
          totalScore: 0,
          randomise: null,
          penalties: [],
        },
        {
          id: 'player-2',
          name: 'Bob',
          scores: [2, null, null, null, null, null, null, null, null],
          totalScore: 2,
          randomise: null,
          penalties: [],
        },
      ],
      activeEvent: null,
    };
  });


  describe('initial state', () => {
    test('should return committed state when no optimistic updates', () => {
      const { result } = renderHook(() => useOptimisticGameState(mockGameState));

      expect(result.current.gameState).toEqual(mockGameState);
      expect(result.current.cellStates).toEqual({});
    });

    test('should handle null committed state', () => {
      const { result } = renderHook(() => useOptimisticGameState(null));

      expect(result.current.gameState).toBeNull();
      expect(result.current.cellStates).toEqual({});
    });
  });

  describe('addOptimisticUpdate', () => {
    test('should add optimistic score update', () => {
      const { result } = renderHook(() => useOptimisticGameState(mockGameState));

      act(() => {
        result.current.addOptimisticUpdate('player-1', 1, 3);
      });

      expect(result.current.gameState.players[0].scores[0]).toBe(3);
      expect(result.current.gameState.players[0].totalScore).toBe(3);
      expect(result.current.cellStates['player-1-1']).toBe('pending');
    });

    test('should update total score correctly', () => {
      const { result } = renderHook(() => useOptimisticGameState(mockGameState));

      act(() => {
        result.current.addOptimisticUpdate('player-2', 2, 4);
      });

      // Bob had 2 points, now has 2 + 4 = 6
      expect(result.current.gameState.players[1].scores[1]).toBe(4);
      expect(result.current.gameState.players[1].totalScore).toBe(6);
    });

    test('should replace existing optimistic update for same cell', () => {
      const { result } = renderHook(() => useOptimisticGameState(mockGameState));

      act(() => {
        result.current.addOptimisticUpdate('player-1', 1, 3);
      });

      act(() => {
        result.current.addOptimisticUpdate('player-1', 1, 5);
      });

      expect(result.current.gameState.players[0].scores[0]).toBe(5);
      expect(result.current.gameState.players[0].totalScore).toBe(5);
    });

    test('should handle multiple optimistic updates for different cells', () => {
      const { result } = renderHook(() => useOptimisticGameState(mockGameState));

      act(() => {
        result.current.addOptimisticUpdate('player-1', 1, 3);
        result.current.addOptimisticUpdate('player-1', 2, 2);
        result.current.addOptimisticUpdate('player-2', 2, 4);
      });

      expect(result.current.gameState.players[0].scores[0]).toBe(3);
      expect(result.current.gameState.players[0].scores[1]).toBe(2);
      expect(result.current.gameState.players[0].totalScore).toBe(5);
      expect(result.current.gameState.players[1].scores[1]).toBe(4);
    });
  });

  describe('reconciliation with committed state', () => {
    test('should confirm update when committed state matches optimistic', async () => {
      const { result, rerender } = renderHook(
        ({ state }) => useOptimisticGameState(state),
        { initialProps: { state: mockGameState } }
      );

      act(() => {
        result.current.addOptimisticUpdate('player-1', 1, 3);
      });

      expect(result.current.cellStates['player-1-1']).toBe('pending');

      // Simulate WebSocket update with matching score
      const updatedState = {
        ...mockGameState,
        players: [
          {
            ...mockGameState.players[0],
            scores: [3, null, null, null, null, null, null, null, null],
            totalScore: 3,
          },
          mockGameState.players[1],
        ],
      };

      act(() => {
        rerender({ state: updatedState });
      });

      // Should transition to success state
      await waitFor(() => {
        expect(result.current.cellStates['player-1-1']).toBe('success');
      });

      // Should remove optimistic update
      expect(result.current.gameState.players[0].scores[0]).toBe(3);
    });

    test('should rollback update when committed state conflicts', async () => {
      const { result, rerender } = renderHook(
        ({ state }) => useOptimisticGameState(state),
        { initialProps: { state: mockGameState } }
      );

      act(() => {
        result.current.addOptimisticUpdate('player-1', 1, 3);
      });

      // Simulate WebSocket update with different score
      const updatedState = {
        ...mockGameState,
        players: [
          {
            ...mockGameState.players[0],
            scores: [5, null, null, null, null, null, null, null, null],
            totalScore: 5,
          },
          mockGameState.players[1],
        ],
      };

      act(() => {
        rerender({ state: updatedState });
      });

      // Should transition to error state
      await waitFor(() => {
        expect(result.current.cellStates['player-1-1']).toBe('error');
      });

      // Should show error toast
      expect(toast.error).toHaveBeenCalledWith('Score conflict detected', {
        description: 'Server has different score for Hole 1',
      });

      // Should use committed score
      expect(result.current.gameState.players[0].scores[0]).toBe(5);
    });

    test('should keep optimistic update if committed state still null', () => {
      const { result, rerender } = renderHook(
        ({ state }) => useOptimisticGameState(state),
        { initialProps: { state: mockGameState } }
      );

      act(() => {
        result.current.addOptimisticUpdate('player-1', 1, 3);
      });

      // Simulate WebSocket update but score still not committed
      const updatedState = {
        ...mockGameState,
        players: mockGameState.players.map((p) => ({ ...p })),
      };

      act(() => {
        rerender({ state: updatedState });
      });

      // Should still show optimistic score
      expect(result.current.gameState.players[0].scores[0]).toBe(3);
      expect(result.current.cellStates['player-1-1']).toBe('pending');
    });
  });

  describe('confirmUpdate', () => {
    test('should remove optimistic update and show success', async () => {
      const { result } = renderHook(() => useOptimisticGameState(mockGameState));

      act(() => {
        result.current.addOptimisticUpdate('player-1', 1, 3);
      });

      act(() => {
        result.current.confirmUpdate('player-1', 1);
      });

      expect(result.current.cellStates['player-1-1']).toBe('success');

      // Success state should clear after timeout
      await waitFor(
        () => {
          expect(result.current.cellStates['player-1-1']).toBeUndefined();
        },
        { timeout: 500 }
      );
    });
  });

  describe('rollbackUpdate', () => {
    test('should remove optimistic update and show error', async () => {
      const { result } = renderHook(() => useOptimisticGameState(mockGameState));

      act(() => {
        result.current.addOptimisticUpdate('player-1', 1, 3);
      });

      act(() => {
        result.current.rollbackUpdate('player-1', 1, 'API error');
      });

      expect(result.current.cellStates['player-1-1']).toBe('error');
      expect(toast.error).toHaveBeenCalledWith('Failed to submit score', {
        description: 'API error',
      });

      // Should revert to committed state
      expect(result.current.gameState.players[0].scores[0]).toBeNull();

      // Error state should clear after timeout
      await waitFor(
        () => {
          expect(result.current.cellStates['player-1-1']).toBeUndefined();
        },
        { timeout: 700 }
      );
    });

    test('should not show toast if no error message provided', () => {
      const { result } = renderHook(() => useOptimisticGameState(mockGameState));

      act(() => {
        result.current.addOptimisticUpdate('player-1', 1, 3);
      });

      const errorCallsBefore = (toast.error as any).mock.calls.length;

      act(() => {
        result.current.rollbackUpdate('player-1', 1);
      });

      const errorCallsAfter = (toast.error as any).mock.calls.length;
      expect(errorCallsAfter).toBe(errorCallsBefore);
    });
  });

  describe('race conditions', () => {
    test('should handle rapid optimistic updates to same cell', () => {
      const { result } = renderHook(() => useOptimisticGameState(mockGameState));

      act(() => {
        result.current.addOptimisticUpdate('player-1', 1, 2);
        result.current.addOptimisticUpdate('player-1', 1, 3);
        result.current.addOptimisticUpdate('player-1', 1, 5);
      });

      // Should only keep the last update
      expect(result.current.gameState.players[0].scores[0]).toBe(5);
      expect(result.current.gameState.players[0].totalScore).toBe(5);
    });

    test('should handle optimistic update arriving before WebSocket', async () => {
      const { result, rerender } = renderHook(
        ({ state }) => useOptimisticGameState(state),
        { initialProps: { state: mockGameState } }
      );

      // User submits optimistically
      act(() => {
        result.current.addOptimisticUpdate('player-1', 1, 3);
      });

      expect(result.current.gameState.players[0].scores[0]).toBe(3);

      // WebSocket update arrives with same score
      const updatedState = {
        ...mockGameState,
        players: [
          {
            ...mockGameState.players[0],
            scores: [3, null, null, null, null, null, null, null, null],
            totalScore: 3,
          },
          mockGameState.players[1],
        ],
      };

      act(() => {
        rerender({ state: updatedState });
      });

      // Should confirm and show success
      await waitFor(() => {
        expect(result.current.cellStates['player-1-1']).toBe('success');
      });
    });

    test('should handle WebSocket update arriving before optimistic confirmation', async () => {
      const { result, rerender } = renderHook(
        ({ state }) => useOptimisticGameState(state),
        { initialProps: { state: mockGameState } }
      );

      // User submits optimistically
      act(() => {
        result.current.addOptimisticUpdate('player-1', 1, 3);
      });

      // WebSocket update arrives quickly (from another player or host action)
      const updatedState = {
        ...mockGameState,
        players: [
          {
            ...mockGameState.players[0],
            scores: [3, null, null, null, null, null, null, null, null],
            totalScore: 3,
          },
          mockGameState.players[1],
        ],
      };

      act(() => {
        rerender({ state: updatedState });
      });

      // Should auto-reconcile
      await waitFor(() => {
        expect(result.current.cellStates['player-1-1']).toBe('success');
      });
    });

    test('should handle multiple players updating simultaneously', () => {
      const { result } = renderHook(() => useOptimisticGameState(mockGameState));

      act(() => {
        result.current.addOptimisticUpdate('player-1', 1, 3);
        result.current.addOptimisticUpdate('player-2', 2, 4);
      });

      expect(result.current.gameState.players[0].scores[0]).toBe(3);
      expect(result.current.gameState.players[1].scores[1]).toBe(4);
      expect(result.current.cellStates['player-1-1']).toBe('pending');
      expect(result.current.cellStates['player-2-2']).toBe('pending');
    });
  });

  describe('edge cases', () => {
    test('should handle updating score from non-null to different value', () => {
      const { result } = renderHook(() => useOptimisticGameState(mockGameState));

      // Bob already has score of 2 on hole 1
      act(() => {
        result.current.addOptimisticUpdate('player-2', 1, 5);
      });

      // Should adjust total: 2 - 2 + 5 = 5
      expect(result.current.gameState.players[1].scores[0]).toBe(5);
      expect(result.current.gameState.players[1].totalScore).toBe(5);
    });

    test('should handle player not found in committed state', () => {
      const { result, rerender } = renderHook(
        ({ state }) => useOptimisticGameState(state),
        { initialProps: { state: mockGameState } }
      );

      act(() => {
        result.current.addOptimisticUpdate('player-3', 1, 3);
      });

      // Update committed state without player-3
      act(() => {
        rerender({ state: mockGameState });
      });

      // Should keep optimistic update even though player not in committed state
      // (This handles the edge case where player joins but WebSocket hasn't updated yet)
      expect(result.current.cellStates['player-3-1']).toBe('pending');
    });

    test('should handle negative scores', () => {
      const { result } = renderHook(() => useOptimisticGameState(mockGameState));

      act(() => {
        result.current.addOptimisticUpdate('player-1', 1, -2);
      });

      expect(result.current.gameState.players[0].scores[0]).toBe(-2);
      expect(result.current.gameState.players[0].totalScore).toBe(-2);
    });
  });
});
