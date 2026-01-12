'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getGameState, completeGame, getRoutes } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSessionStorage } from '@/hooks/useSessionStorage';
import { useGameWebSocket } from '@/hooks/useGameWebSocket';
import { ScoreboardTable } from '@/components/ScoreboardTable';
import { ShareModal } from '@/components/ShareModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { CelebrationScreen } from '@/components/CelebrationScreen';
import { EventNotificationOverlay } from '@/components/EventNotificationOverlay';
import { EventBanner } from '@/components/EventBanner';
import { Toast } from '@/components/Toast';
import { Player, GameStatus, GameState, ActiveEvent } from '@/lib/types';

const DEFAULT_PARS = [1, 3, 2, 2, 2, 2, 4, 1, 1];

export default function GamePage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [pars, setPars] = useState<number[]>(DEFAULT_PARS);
  const [gameCode, setGameCode] = useState<string>('');
  const [status, setStatus] = useState<GameStatus>('ACTIVE');
  const [hostPlayerId, setHostPlayerId] = useState<string | null>(null);
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showEventNotification, setShowEventNotification] = useState(false);
  const [showEventEndedToast, setShowEventEndedToast] = useState(false);
  const previousEventIdRef = useRef<string | null>(null);
  const router = useRouter();
  const { getGameCode, getPlayerId } = useLocalStorage();
  const { getLastSeenEventId, setLastSeenEventId, getQueuedEventId, setQueuedEventId } = useSessionStorage();

  const handleGameStateUpdate = useCallback((state: GameState) => {
    setPlayers(state.players);
    setStatus(state.status);
    setHostPlayerId(state.hostPlayerId);

    const newEventId = state.activeEvent?.id ?? null;
    const prevEventId = previousEventIdRef.current;

    if (newEventId !== prevEventId) {
      if (newEventId && state.activeEvent) {
        const lastSeenId = getLastSeenEventId();
        if (lastSeenId !== newEventId) {
          setShowEventNotification(true);
        }
      } else if (prevEventId && !newEventId) {
        setShowEventEndedToast(true);
      }
    }

    previousEventIdRef.current = newEventId;
    setActiveEvent(state.activeEvent);

    if (state.status === 'COMPLETED') {
      setShowCelebration(true);
    }
    setError('');
  }, [getLastSeenEventId]);

  useGameWebSocket({
    gameCode,
    onGameStateUpdate: handleGameStateUpdate,
    enabled: !loading && status !== 'COMPLETED',
  });

  const fetchGame = useCallback(async () => {
    const code = getGameCode();
    if (!code) {
      router.push('/');
      return;
    }

    setGameCode(code);

    try {
      const state = await getGameState(code);
      handleGameStateUpdate(state);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game');
    } finally {
      setLoading(false);
    }
  }, [getGameCode, router, handleGameStateUpdate]);

  useEffect(() => {
    fetchGame();
  }, [fetchGame]);

  useEffect(() => {
    getRoutes()
      .then((response) => setPars(response.holes.map((hole) => hole.par)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const queuedEventId = getQueuedEventId();
    if (queuedEventId && activeEvent && activeEvent.id === queuedEventId) {
      setShowEventNotification(true);
      setQueuedEventId(null);
    }
  }, [activeEvent, getQueuedEventId, setQueuedEventId]);

  const handleEventNotificationDismiss = useCallback(() => {
    setShowEventNotification(false);
    if (activeEvent) {
      setLastSeenEventId(activeEvent.id);
    }
  }, [activeEvent, setLastSeenEventId]);

  const playerId = getPlayerId();
  const currentPlayer = players.find(p => p.id === playerId);
  const hasUsedRandomise = currentPlayer?.randomise != null;
  const isHost = playerId === hostPlayerId;
  const isCompleted = status === 'COMPLETED';

  const getWinners = (): Player[] => {
    if (players.length === 0) return [];
    const minScore = Math.min(...players.map(p => p.totalScore));
    return players.filter(p => p.totalScore === minScore);
  };

  const handleCompleteGame = async () => {
    if (!playerId || !gameCode) return;

    setCompleting(true);
    try {
      const state = await completeGame(gameCode, playerId);
      setPlayers(state.players);
      setStatus(state.status);
      setHostPlayerId(state.hostPlayerId);
      setShowConfirmModal(false);
      setShowCelebration(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete game');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-full flex items-center justify-center">
        <p className="text-[var(--color-text-secondary)] animate-pulse">Loading game...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-full flex flex-col items-center justify-center p-4 gap-4">
        <p className="text-[var(--color-error)] bg-[var(--color-error-bg)] px-4 py-2 rounded-lg">{error}</p>
        <Link href="/" className="text-[var(--color-primary)] hover:underline">
          Back to Home
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
              Game: <span className="text-[var(--color-accent)]">{gameCode.toUpperCase()}</span>
            </h1>
            <p className="text-[var(--color-text-secondary)] text-sm">
              Rally your crew
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isHost && !isCompleted && (
              <Link
                href={`/game/${gameCode.toLowerCase()}/host`}
                className="px-4 py-2 glass rounded-lg hover:bg-white/5 transition-colors text-sm shrink-0 border border-[var(--color-accent)]/30 text-[var(--color-accent)]"
              >
                Host Panel
              </Link>
            )}
            {isHost && !isCompleted && (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="px-4 py-2 glass rounded-lg hover:bg-white/5 transition-colors text-sm shrink-0 border border-[var(--color-danger)]/30 text-[var(--color-danger)]"
              >
                End Game
              </button>
            )}
            {!isCompleted && (
              <button
                onClick={() => setShowShareModal(true)}
                className="px-4 py-2 glass rounded-lg hover:bg-white/5 transition-colors text-sm shrink-0 flex items-center gap-2"
              >
                <span>Invite</span>
              </button>
            )}
          </div>
        </header>

        {isCompleted && (
          <div className="bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 rounded-lg px-4 py-3 text-center">
            <p className="font-semibold text-[var(--color-accent)]">
              🏆 Game Complete
            </p>
          </div>
        )}

        {activeEvent && !isCompleted && (
          <EventBanner event={activeEvent} />
        )}

        <section className="glass rounded-xl p-4">
          <ScoreboardTable
            players={players}
            pars={pars}
            currentPlayerId={playerId ?? undefined}
            hostPlayerId={hostPlayerId ?? undefined}
          />
        </section>

        <nav className="space-y-3">
          {playerId && !isCompleted && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/submit-score"
                className="flex-1 py-3 px-4 btn-gradient text-center font-medium rounded-lg"
              >
                Log Your Sips
              </Link>
              {hasUsedRandomise ? (
                <span className="flex-1 py-3 px-4 bg-[var(--color-border)] text-[var(--color-text-secondary)] text-center font-medium rounded-lg cursor-not-allowed opacity-50">
                  Randomise Used
                </span>
              ) : (
                <Link
                  href="/randomise"
                  className="flex-1 py-3 px-4 glass text-center font-medium rounded-lg hover:bg-white/5 transition-colors border border-[var(--color-primary)]/30"
                >
                  Randomise
                </Link>
              )}
            </div>
          )}
          <Link
            href="/how-to-play"
            className="block py-3 px-4 glass text-center font-medium rounded-lg hover:bg-white/5 transition-colors"
          >
            The Rules
          </Link>
        </nav>
      </div>

      {showShareModal && (
        <ShareModal
          gameCode={gameCode}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {showConfirmModal && (
        <ConfirmModal
          title="End Game?"
          message="This will permanently end the game. No more scores can be submitted and no one else can join."
          confirmText="End Game"
          cancelText="Cancel"
          onConfirm={handleCompleteGame}
          onCancel={() => setShowConfirmModal(false)}
          loading={completing}
        />
      )}

      {showCelebration && isCompleted && (
        <CelebrationScreen
          winners={getWinners()}
          onDismiss={() => setShowCelebration(false)}
        />
      )}

      {showEventNotification && activeEvent && (
        <EventNotificationOverlay
          event={activeEvent}
          onDismiss={handleEventNotificationDismiss}
        />
      )}

      {showEventEndedToast && (
        <Toast
          message="Event ended"
          onDismiss={() => setShowEventEndedToast(false)}
        />
      )}
    </main>
  );
}
