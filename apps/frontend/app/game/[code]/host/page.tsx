'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getGameState, getAvailableEvents, activateEvent, endEvent, completeGame } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useGameWebSocket } from '@/hooks/useGameWebSocket';
import { EventCard } from '@/components/EventCard';
import { ConfirmModal } from '@/components/ConfirmModal';
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
        <p className="text-[var(--color-error)] bg-[var(--color-error-bg)] px-4 py-2 rounded-lg">{error}</p>
        <Link href="/game" className="text-[var(--color-primary)] hover:underline">
          Back to Game
        </Link>
      </main>
    );
  }

  return (
    <main className="p-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-display)]">
              Host Panel
            </h1>
            <p className="text-[var(--color-text-secondary)] text-sm">
              Game: <span className="text-[var(--color-accent)]">{gameCode.toUpperCase()}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEndGameModal(true)}
              className="px-4 py-2 glass rounded-lg hover:bg-white/5 transition-colors text-sm shrink-0 border border-[var(--color-danger)]/30 text-[var(--color-danger)]"
            >
              End Game
            </button>
            <Link
              href="/game"
              className="px-4 py-2 glass rounded-lg hover:bg-white/5 transition-colors text-sm shrink-0"
            >
              Back to Game
            </Link>
          </div>
        </header>

        {activeEvent && (
          <div className="glass rounded-xl p-4 border-l-4 border-[var(--color-accent)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl" role="img" aria-label="Active Event">
                  📣
                </span>
                <div>
                  <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide mb-1">
                    Active Event
                  </p>
                  <h3 className="font-bold text-[var(--color-accent)] font-[family-name:var(--font-display)]">
                    {activeEvent.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    {activeEvent.description}
                  </p>
                </div>
              </div>
              <button
                onClick={handleEndEvent}
                disabled={endingEvent}
                className="px-4 py-2 glass rounded-lg hover:bg-white/5 transition-colors text-sm shrink-0 border border-[var(--color-danger)]/30 text-[var(--color-danger)] disabled:opacity-50"
              >
                {endingEvent ? 'Ending...' : 'End Event'}
              </button>
            </div>
          </div>
        )}

        <section>
          <h2 className="text-lg font-semibold mb-4">Available Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
