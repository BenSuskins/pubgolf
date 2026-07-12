'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getGameState, getAvailableEvents, activateEvent, endEvent, completeGame } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useGameWebSocket } from '@/hooks/useGameWebSocket';
import { EventCard } from '@/components/EventCard';
import { ConfirmModal } from '@/components/ConfirmModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { GameEvent, GameState, ActiveEvent } from '@/lib/types';

export default function HostPanelPage() {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null);
  const [gameStatus, setGameStatus] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activatingEventId, setActivatingEventId] = useState<string | null>(null);
  const [endingEvent, setEndingEvent] = useState(false);
  const [confirmEvent, setConfirmEvent] = useState<GameEvent | null>(null);
  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const [completing, setCompleting] = useState(false);
  const router = useRouter();
  const params = useParams();
  const gameCode = (params.code as string) ?? '';
  const { getPlayerId, setGameSession, getGameCode: getStoredGameCode } = useLocalStorage();

  const handleGameStateUpdate = useCallback((state: GameState) => {
    setActiveEvent(state.activeEvent);
    setGameStatus(state.status);
  }, []);

  useGameWebSocket({
    gameCode,
    playerId: getPlayerId(),
    onGameStateUpdate: handleGameStateUpdate,
    enabled: !loading && gameStatus !== 'COMPLETED',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!gameCode) {
        router.push('/');
        return;
      }

      try {
        const [state, eventsResponse] = await Promise.all([
          getGameState(gameCode),
          getAvailableEvents(gameCode),
        ]);

        setActiveEvent(state.activeEvent);
        setGameStatus(state.status);
        setEvents(eventsResponse.events);

        const playerId = getPlayerId();
        if (state.hostPlayerId !== playerId) {
          router.push(`/game`);
          return;
        }

        if (state.status === 'COMPLETED') {
          router.push(`/game`);
          return;
        }

        const storedCode = getStoredGameCode();
        if (!storedCode || storedCode.toLowerCase() !== gameCode.toLowerCase()) {
          setGameSession(gameCode, playerId ?? '', '');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load host panel');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [gameCode, router, getPlayerId, getStoredGameCode, setGameSession]);

  const handleActivateEvent = async (event: GameEvent) => {
    const playerId = getPlayerId();
    if (!playerId || !gameCode) return;

    setError('');
    setActivatingEventId(event.id);
    setConfirmEvent(null);
    try {
      const state = await activateEvent(gameCode, event.id, playerId);
      setActiveEvent(state.activeEvent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate event');
    } finally {
      setActivatingEventId(null);
    }
  };

  const handleEndEvent = async () => {
    const playerId = getPlayerId();
    if (!playerId || !gameCode) return;

    setError('');
    setEndingEvent(true);
    try {
      const state = await endEvent(gameCode, playerId);
      setActiveEvent(state.activeEvent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end event');
    } finally {
      setEndingEvent(false);
    }
  };

  const handleCompleteGame = async () => {
    const playerId = getPlayerId();
    if (!playerId || !gameCode) return;

    setError('');
    setCompleting(true);
    try {
      await completeGame(gameCode, playerId);
      setShowEndGameModal(false);
      router.push('/game');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end game');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-full flex items-center justify-center">
        <p className="text-[var(--color-text-secondary)] animate-pulse">Loading host panel...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-full flex flex-col items-center justify-center p-4 gap-4">
        <ErrorMessage
          message={error}
          variant="card"
          action={{ label: "Back to Game", onClick: () => router.push('/game') }}
        />
      </main>
    );
  }

  return (
    <main className="p-5 py-5">
      <div className="max-w-4xl mx-auto space-y-5">
        <div>
          <Link
            href="/game"
            className="text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
          >
            ← Back to Scoreboard
          </Link>
        </div>

        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 2 3 7v6c0 5 4 8 9 9 5-1 9-4 9-9V7l-9-5Z"
                  stroke="var(--color-accent)"
                  strokeWidth="1.8"
                />
              </svg>
              <span className="eyebrow text-[var(--color-accent)]">Host Mode</span>
            </div>
            <h1 className="font-display text-2xl text-[var(--color-text)]">
              {gameCode.toUpperCase()}
            </h1>
          </div>
          <button
            onClick={() => setShowEndGameModal(true)}
            className="px-3.5 py-2.5 surface-danger rounded-[10px] text-[var(--color-error)] font-bold text-[12.5px] shrink-0 hover:bg-[var(--color-danger-border)]/40 transition-colors"
          >
            End Game
          </button>
        </header>

        {activeEvent && (
          <div className="surface-gold rounded-[14px] px-3.5 py-3 flex items-center gap-2.5">
            <span className="text-base" role="img" aria-label="Active Event">
              📣
            </span>
            <div className="flex-1 min-w-0">
              <p className="eyebrow text-[10px] text-[var(--color-text-muted)]">Active Event</p>
              <h3 className="text-[var(--color-accent)] font-bold text-sm mt-0.5">
                {activeEvent.title}
              </h3>
              <p className="text-[11.5px] text-[#b0a583] mt-px truncate">
                {activeEvent.description}
              </p>
            </div>
            <button
              onClick={handleEndEvent}
              disabled={endingEvent}
              className="min-h-[40px] px-3.5 surface-danger rounded-[9px] text-[var(--color-error)] font-bold text-[12.5px] whitespace-nowrap shrink-0 disabled:opacity-50 hover:bg-[var(--color-danger-border)]/40 transition-colors"
            >
              {endingEvent ? 'Ending...' : 'End Event'}
            </button>
          </div>
        )}

        <section>
          <h2 className="eyebrow text-[12.5px] text-[var(--color-text-muted)] mb-2.5">
            Trigger an Event
          </h2>
          {events.length === 0 ? (
            <EmptyState
              icon="📝"
              description="No events configured for this game yet"
            />
          ) : (
            <div className="flex flex-col gap-2">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isActive={activeEvent?.id === event.id}
                  isOtherEventActive={activeEvent !== null && activeEvent.id !== event.id}
                  onActivate={() => setConfirmEvent(event)}
                  isLoading={activatingEventId === event.id}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {confirmEvent && (
        <ConfirmModal
          title={`Activate "${confirmEvent.title}"?`}
          message="This event will be announced to all players in the game."
          confirmText="Activate"
          cancelText="Cancel"
          onConfirm={() => handleActivateEvent(confirmEvent)}
          onCancel={() => setConfirmEvent(null)}
          loading={activatingEventId === confirmEvent.id}
        />
      )}

      {showEndGameModal && (
        <ConfirmModal
          title="End Game?"
          message="This will permanently end the game. No more scores can be submitted and no one else can join."
          confirmText="End Game"
          cancelText="Cancel"
          onConfirm={handleCompleteGame}
          onCancel={() => setShowEndGameModal(false)}
          loading={completing}
        />
      )}
    </main>
  );
}
