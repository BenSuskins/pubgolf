'use client';

const LAST_SEEN_EVENT_ID_KEY = 'lastSeenEventId';
const QUEUED_EVENT_ID_KEY = 'queuedEventId';

export function useSessionStorage() {
  const getLastSeenEventId = (): string | null => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(LAST_SEEN_EVENT_ID_KEY);
  };

  const setLastSeenEventId = (eventId: string): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(LAST_SEEN_EVENT_ID_KEY, eventId);
  };

  const getQueuedEventId = (): string | null => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(QUEUED_EVENT_ID_KEY);
  };

  const setQueuedEventId = (eventId: string | null): void => {
    if (typeof window === 'undefined') return;
    if (eventId === null) {
      sessionStorage.removeItem(QUEUED_EVENT_ID_KEY);
    } else {
      sessionStorage.setItem(QUEUED_EVENT_ID_KEY, eventId);
    }
  };

  return {
    getLastSeenEventId,
    setLastSeenEventId,
    getQueuedEventId,
    setQueuedEventId,
  };
}
