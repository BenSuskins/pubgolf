'use client';

import { useCallback } from 'react';

export function useSeenEvents(gameCode: string | null) {
  const getStorageKey = useCallback(
    (): string | null => {
      if (!gameCode) return null;
      return `pubgolf-${gameCode}-seenEvents`;
    },
    [gameCode]
  );

  const getSeenEvents = useCallback((): string[] => {
    if (typeof window === 'undefined') return [];
    const key = getStorageKey();
    if (!key) return [];

    const stored = localStorage.getItem(key);
    if (!stored) return [];

    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }, [getStorageKey]);

  const markEventAsSeen = useCallback(
    (eventId: string) => {
      if (typeof window === 'undefined') return;
      const key = getStorageKey();
      if (!key) return;

      const seen = getSeenEvents();
      if (!seen.includes(eventId)) {
        localStorage.setItem(key, JSON.stringify([...seen, eventId]));
      }
    },
    [getStorageKey, getSeenEvents]
  );

  const hasSeenEvent = useCallback(
    (eventId: string): boolean => {
      return getSeenEvents().includes(eventId);
    },
    [getSeenEvents]
  );

  return {
    getSeenEvents,
    markEventAsSeen,
    hasSeenEvent,
  };
}
