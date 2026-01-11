'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getEvents, startEvent, endEvent, getGameState, completeGame } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useGameWebSocket } from '@/hooks/useGameWebSocket';
import { EventCard } from '@/components/EventCard';
import { ConfirmModal } from '@/components/ConfirmModal';
import { EventModal } from '@/components/EventModal';
import { Event, EventPayload } from '@/lib/types';

export default function HostPage() {
  const params = useParams();
  const router = useRouter();
  const gameCode = params.gameCode as string;
  const { getPlayerId } = useLocalStorage();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [confirmEvent, setConfirmEvent] = useState<Event | null>(null);
  const [showEndGameConfirm, setShowEndGameConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [currentEventPayload, setCurrentEventPayload] = useState<EventPayload | null>(null);

  const { activeEvent, gameEnded } = useGameWebSocket(gameCode);

  const playerId = getPlayerId();

  useEffect(() => {
    const init = async () => {
      try {
        const [state, eventsResponse] = await Promise.all([
          getGameState(gameCode),
          getEvents(),
        ]);

        setEvents(eventsResponse.events);

        if (state.hostPlayerId !== playerId) {
          router.push('/game');
          return;
        }

        if (state.status === 'COMPLETED') {
          router.push('/game');
          return;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [gameCode, playerId, router]);

  useEffect(() => {
    if (activeEvent) {
      setCurrentEventPayload(activeEvent);
      setConfirmEvent(null);
    } else {
      setCurrentEventPayload(null);
    }
  }, [activeEvent]);

  useEffect(() => {
    if (gameEnded) {
      router.push('/game');
    }
  }, [gameEnded, router]);

  const handleStartEvent = async (event: Event) => {
    if (!playerId) return;

    setActionLoading(true);
    try {
      await startEvent(gameCode, playerId, event.id);
      setShowEventModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start event');
    } finally {
      setActionLoading(false);
      setConfirmEvent(null);
    }
  };

  const handleEndEvent = async () => {
    if (!playerId) return;

    setActionLoading(true);
    try {
      await endEvent(gameCode, playerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end event');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndGame = async () => {
    if (!playerId) return;

    setActionLoading(true);
    try {
      await completeGame(gameCode, playerId);
      router.push('/game');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end game');
    } finally {
      setActionLoading(false);
      setShowEndGameConfirm(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-full flex items-center justify-center">
        <p className="text-[var(--color-text-secondary)] animate-pulse">Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-full flex flex-col items-center justify-center p-4 gap-4">
        <p className="text-[var(--color-error)] bg-[var(--color-error-bg)] px-4 py-2 rounded-lg">
          {error}
        </p>
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
              Host Controls
            </h1>
            <p className="text-[var(--color-text-secondary)] text-sm">
              Game: {gameCode.toUpperCase()}
            </p>
          </div>
          <Link
            href="/game"
            className="px-4 py-2 glass rounded-lg hover:bg-white/5 transition-colors text-sm"
          >
            Back to Scoreboard
          </Link>
        </header>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {events.map(event => (
              <EventCard
                key={event.id}
                event={event}
                isActive={currentEventPayload?.eventId === event.id}
                isDisabled={currentEventPayload !== null && currentEventPayload.eventId !== event.id}
                onSelect={() => setConfirmEvent(event)}
                onEndEvent={handleEndEvent}
              />
            ))}
          </div>
        </section>

        <section className="pt-4">
          <button
            onClick={() => setShowEndGameConfirm(true)}
            className="w-full py-3 px-4 glass rounded-lg border border-[var(--color-danger)]/30 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors"
          >
            End Game
          </button>
        </section>
      </div>

      {confirmEvent && (
        <ConfirmModal
          title={`Start ${confirmEvent.name}?`}
          message={confirmEvent.description}
          confirmText="Start Event"
          cancelText="Cancel"
          onConfirm={() => handleStartEvent(confirmEvent)}
          onCancel={() => setConfirmEvent(null)}
          loading={actionLoading}
        />
      )}

      {showEndGameConfirm && (
        <ConfirmModal
          title="End Game?"
          message="This will end any active event and permanently close the game. No more scores can be submitted."
          confirmText="End Game"
          cancelText="Cancel"
          onConfirm={handleEndGame}
          onCancel={() => setShowEndGameConfirm(false)}
          loading={actionLoading}
        />
      )}

      {showEventModal && currentEventPayload && (
        <EventModal
          event={currentEventPayload}
          onDismiss={() => setShowEventModal(false)}
        />
      )}
    </main>
  );
}
