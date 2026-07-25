'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import { getGameState, getAvailableEvents, activateEvent, activateCustomEvent, endEvent, completeGame, getRoute, setHoles } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useGameWebSocket } from '@/hooks/useGameWebSocket';
import { HostEventsTab } from '@/components/HostEventsTab';
import { HostCourseTab } from '@/components/HostCourseTab';
import { CustomEventSheet } from '@/components/CustomEventSheet';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { GameEvent, GameState, ActiveEvent, RouteHole, PubLocation } from '@/lib/types';

type HostTab = 'events' | 'course';

const TAB_PANEL_ID = 'host-panel-tabpanel';

export default function HostPanelPage() {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null);
  const [gameStatus, setGameStatus] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');
  const [loading, setLoading] = useState(true);
  // A failed load leaves nothing to show; a failed action just annotates the panel.
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [activatingEventId, setActivatingEventId] = useState<string | null>(null);
  const [endingEvent, setEndingEvent] = useState(false);
  const [confirmEvent, setConfirmEvent] = useState<GameEvent | null>(null);
  const [customEventSheetOpen, setCustomEventSheetOpen] = useState(false);
  const [pubs, setPubs] = useState<PubLocation[]>([]);
  const [course, setCourse] = useState<RouteHole[]>([]);
  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const [completing, setCompleting] = useState(false);
  // Events is what a host needs mid-round; course setup is a one-time job before it.
  const [tab, setTab] = useState<HostTab>('events');
  const router = useRouter();
  const params = useParams();
  const gameCode = (params.code as string) ?? '';
  const { getPlayerId, setGameSession, getGameCode: getStoredGameCode } = useLocalStorage();

  const handleGameStateUpdate = useCallback((state: GameState) => {
    setActiveEvent(state.activeEvent);
    setGameStatus(state.status);
    setCourse(state.holes);
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
        setCourse(state.holes);
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
        if (playerId && (!storedCode || storedCode.toLowerCase() !== gameCode.toLowerCase())) {
          setGameSession(gameCode, playerId);
        }

        try {
          const routeData = await getRoute(gameCode);
          setPubs(routeData.pubs);
        } catch {
          setPubs([]);
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load host panel');
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

  const handleActivateCustomEvent = async (title: string, description: string) => {
    const playerId = getPlayerId();
    if (!playerId || !gameCode) return;

    setError('');
    const state = await activateCustomEvent(gameCode, title, description, playerId);
    setActiveEvent(state.activeEvent);
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

  const handleSaveCourse = async (updated: RouteHole[]) => {
    const playerId = getPlayerId();
    if (!playerId || !gameCode) return;

    const state = await setHoles(gameCode, playerId, updated);
    setCourse(state.holes);
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
      <div className="flex min-h-full items-center justify-center">
        <p className="text-[var(--color-text-secondary)] animate-pulse">Loading host panel...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 p-4">
        <ErrorMessage
          message={loadError}
          variant="card"
          action={{ label: 'Back to Game', onClick: () => router.push('/game') }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col gap-3.5 p-5">
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

      <SegmentedControl<HostTab>
        size="sm"
        ariaLabel="Host panel section"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'events', label: 'Events', badge: '1', controls: TAB_PANEL_ID },
          { value: 'course', label: 'Course', badge: '2', controls: TAB_PANEL_ID },
        ]}
      />

      {/* The active event is game-wide state, so it renders the same on both tabs. */}
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
            {activeEvent.description && (
              <p className="text-[11.5px] text-[#b0a583] mt-px truncate">
                {activeEvent.description}
              </p>
            )}
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

      {error && <ErrorMessage message={error} variant="inline" />}

      <div id={TAB_PANEL_ID} className="flex min-h-0 flex-1 flex-col">
        {tab === 'events' ? (
          <HostEventsTab
            events={events}
            activeEvent={activeEvent}
            activatingEventId={activatingEventId}
            onActivate={setConfirmEvent}
            onOpenCustomEvent={() => setCustomEventSheetOpen(true)}
          />
        ) : (
          <HostCourseTab pubs={pubs} course={course} onSaveCourse={handleSaveCourse} />
        )}
      </div>

      <AnimatePresence>
        {customEventSheetOpen && (
          <CustomEventSheet
            onTrigger={handleActivateCustomEvent}
            onClose={() => setCustomEventSheetOpen(false)}
          />
        )}
      </AnimatePresence>

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
    </div>
  );
}
