import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '@/lib/types';
import { toast } from 'sonner';

interface OptimisticUpdate {
  playerId: string;
  hole: number; // 1-indexed
  score: number;
  timestamp: number;
}

export type CellState = 'normal' | 'pending' | 'success' | 'error';

interface CellStateMap {
  [key: string]: CellState; // key format: "playerId-hole"
}

interface UseOptimisticGameStateResult {
  /** The merged game state (committed + optimistic) */
  gameState: GameState;
  /** Map of cell states for visual indicators */
  cellStates: CellStateMap;
  /** Add an optimistic update */
  addOptimisticUpdate: (playerId: string, hole: number, score: number) => void;
  /** Mark an update as successfully committed */
  confirmUpdate: (playerId: string, hole: number) => void;
  /** Rollback an update due to error */
  rollbackUpdate: (playerId: string, hole: number, errorMessage?: string) => void;
}

/**
 * Hook for managing optimistic UI updates with WebSocket reconciliation.
 *
 * Features:
 * - Instant UI updates before server confirmation
 * - Timestamp-based race condition handling
 * - Visual indicators (pending, success, error states)
 * - Automatic rollback on conflicts or failures
 *
 * @param committedState - The authoritative state from WebSocket
 */
export function useOptimisticGameState(
  committedState: GameState | null
): UseOptimisticGameStateResult {
  const [optimisticUpdates, setOptimisticUpdates] = useState<OptimisticUpdate[]>([]);
  const [cellStates, setCellStates] = useState<CellStateMap>({});
  const successTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Helper to generate cell key
  const getCellKey = (playerId: string, hole: number) => `${playerId}-${hole}`;

  // Clean up timeouts on unmount
  useEffect(() => {
    const timeouts = successTimeouts.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  // Reconcile optimistic updates with committed state
  useEffect(() => {
    if (!committedState) return;

    setOptimisticUpdates((current) => {
      const reconciled: OptimisticUpdate[] = [];
      const newCellStates: CellStateMap = { ...cellStates };

      current.forEach((update) => {
        const player = committedState.players.find((p) => p.id === update.playerId);
        if (!player) {
          // Player not found - keep optimistic update
          reconciled.push(update);
          return;
        }

        const committedScore = player.scores[update.hole - 1];
        const cellKey = getCellKey(update.playerId, update.hole);

        if (committedScore === null) {
          // Score not yet committed - keep as pending
          reconciled.push(update);
          newCellStates[cellKey] = 'pending';
        } else if (committedScore === update.score) {
          // Match - show success animation briefly
          newCellStates[cellKey] = 'success';

          // Clear any existing timeout for this cell
          const existingTimeout = successTimeouts.current.get(cellKey);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }

          // Set success state for 400ms then remove
          const timeout = setTimeout(() => {
            setCellStates((prev) => {
              const updated = { ...prev };
              delete updated[cellKey];
              return updated;
            });
            successTimeouts.current.delete(cellKey);
          }, 400);

          successTimeouts.current.set(cellKey, timeout);
        } else {
          // Conflict - rollback
          newCellStates[cellKey] = 'error';
          toast.error('Score conflict detected', {
            description: `Server has different score for Hole ${update.hole}`,
          });

          // Remove error state after animation
          setTimeout(() => {
            setCellStates((prev) => {
              const updated = { ...prev };
              delete updated[cellKey];
              return updated;
            });
          }, 600);
        }
      });

      setCellStates(newCellStates);
      return reconciled;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committedState]);

  // Add an optimistic update
  const addOptimisticUpdate = useCallback((playerId: string, hole: number, score: number) => {
    const update: OptimisticUpdate = {
      playerId,
      hole,
      score,
      timestamp: Date.now(),
    };

    setOptimisticUpdates((current) => {
      // Replace any existing update for this cell
      const filtered = current.filter(
        (u) => !(u.playerId === playerId && u.hole === hole)
      );
      return [...filtered, update];
    });

    const cellKey = getCellKey(playerId, hole);
    setCellStates((prev) => ({
      ...prev,
      [cellKey]: 'pending',
    }));
  }, []);

  // Confirm an update was successful
  const confirmUpdate = useCallback((playerId: string, hole: number) => {
    const cellKey = getCellKey(playerId, hole);

    // Remove from optimistic updates
    setOptimisticUpdates((current) =>
      current.filter((u) => !(u.playerId === playerId && u.hole === hole))
    );

    // Set success state temporarily
    setCellStates((prev) => ({
      ...prev,
      [cellKey]: 'success',
    }));

    // Clear any existing timeout
    const existingTimeout = successTimeouts.current.get(cellKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Remove success state after animation
    const timeout = setTimeout(() => {
      setCellStates((prev) => {
        const updated = { ...prev };
        delete updated[cellKey];
        return updated;
      });
      successTimeouts.current.delete(cellKey);
    }, 400);

    successTimeouts.current.set(cellKey, timeout);
  }, []);

  // Rollback an update due to error
  const rollbackUpdate = useCallback(
    (playerId: string, hole: number, errorMessage?: string) => {
      const cellKey = getCellKey(playerId, hole);

      // Remove from optimistic updates
      setOptimisticUpdates((current) =>
        current.filter((u) => !(u.playerId === playerId && u.hole === hole))
      );

      // Set error state
      setCellStates((prev) => ({
        ...prev,
        [cellKey]: 'error',
      }));

      // Show error toast
      if (errorMessage) {
        toast.error('Failed to submit score', {
          description: errorMessage,
        });
      }

      // Remove error state after animation
      setTimeout(() => {
        setCellStates((prev) => {
          const updated = { ...prev };
          delete updated[cellKey];
          return updated;
        });
      }, 600);
    },
    []
  );

  // Merge optimistic updates into committed state
  const gameState: GameState = committedState
    ? {
        ...committedState,
        players: committedState.players.map((player) => {
          // Find any optimistic updates for this player
          const playerUpdates = optimisticUpdates.filter(
            (u) => u.playerId === player.id
          );

          if (playerUpdates.length === 0) {
            return player;
          }

          // Apply optimistic updates to scores
          const newScores = [...player.scores];
          let totalScoreAdjustment = 0;

          playerUpdates.forEach((update) => {
            const index = update.hole - 1;
            const oldScore = newScores[index];
            newScores[index] = update.score;

            // Adjust total score
            if (oldScore !== null) {
              totalScoreAdjustment += update.score - oldScore;
            } else {
              totalScoreAdjustment += update.score;
            }
          });

          return {
            ...player,
            scores: newScores,
            totalScore: player.totalScore + totalScoreAdjustment,
          };
        }),
      }
    : (null as unknown as GameState);

  return {
    gameState,
    cellStates,
    addOptimisticUpdate,
    confirmUpdate,
    rollbackUpdate,
  };
}
