'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import { getGameState, getRoutes, getRoute } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSessionStorage } from '@/hooks/useSessionStorage';
import { useGameWebSocket } from '@/hooks/useGameWebSocket';
import { Leaderboard } from '@/components/Leaderboard';
import { ScoreboardSkeleton } from '@/components/ScoreboardSkeleton';
import { ShareModal } from '@/components/ShareModal';
import { CelebrationScreen } from '@/components/CelebrationScreen';
import { EventNotificationOverlay } from '@/components/EventNotificationOverlay';
import { EventBanner } from '@/components/EventBanner';
import { Player, GameState } from '@/lib/types';
import { firstUnplayedHole, playerParRelative } from '@/lib/scoring';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

const DEFAULT_PARS = [1, 3, 2, 2, 2, 2, 4, 1, 1];

export default function GamePage() {
  const [committedGameState, setCommittedGameState] = useState<GameState | null>(null);
  const [pars, setPars] = useState<number[]>(DEFAULT_PARS);
  const [gameCode, setGameCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showEventNotification, setShowEventNotification] = useState(false);
  const [hasPubRoute, setHasPubRoute] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const previousEventIdRef = useRef<string | null>(null);
  const router = useRouter();
  const { getGameCode, getPlayerId } = useLocalStorage();
  const { getLastSeenEventId, setLastSeenEventId, getQueuedEventId, setQueuedEventId } = useSessionStorage();

  // Derive values from game state
  const players = committedGameState?.players || [];
  const status = committedGameState?.status || 'ACTIVE';
  const hostPlayerId = committedGameState?.hostPlayerId || null;
  const activeEvent = committedGameState?.activeEvent || null;

  const handleGameStateUpdate = useCallback((state: GameState) => {
    setCommittedGameState(state);

    const newEventId = state.activeEvent?.id ?? null;
    const prevEventId = previousEventIdRef.current;

    if (newEventId !== prevEventId) {
      if (newEventId && state.activeEvent) {
        const lastSeenId = getLastSeenEventId();
        if (lastSeenId !== newEventId) {
          setShowEventNotification(true);
        }
      } else if (prevEventId && !newEventId) {
        toast('Event ended');
      }
    }

    previousEventIdRef.current = newEventId;

    if (state.status === 'COMPLETED') {
      setShowCelebration(true);
    }
    setError('');
  }, [getLastSeenEventId]);

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

  const { connectionError } = useGameWebSocket({
    gameCode,
    playerId,
    onGameStateUpdate: handleGameStateUpdate,
    onReconnect: fetchGame,
    enabled: !loading && status !== 'COMPLETED',
  });

  useEffect(() => {
    setPlayerId(getPlayerId());
  }, [getPlayerId]);

  useEffect(() => {
    fetchGame();
  }, [fetchGame]);

  // Mobile browsers drop the socket while the phone is locked or backgrounded;
  // refetch when the page becomes visible again so the board is never stale.
  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchGame();
      }
    };
    document.addEventListener('visibilitychange', refreshIfVisible);
    window.addEventListener('focus', refreshIfVisible);
    return () => {
      document.removeEventListener('visibilitychange', refreshIfVisible);
      window.removeEventListener('focus', refreshIfVisible);
    };
  }, [fetchGame]);

  useEffect(() => {
    getRoutes()
      .then((response) => setPars(response.holes.map((hole) => hole.par)))
      .catch((err) => console.warn('Could not load par data, using defaults:', err));
  }, []);

  useEffect(() => {
    const queuedEventId = getQueuedEventId();
    if (queuedEventId && activeEvent && activeEvent.id === queuedEventId) {
      setShowEventNotification(true);
      setQueuedEventId(null);
    }
  }, [activeEvent, getQueuedEventId, setQueuedEventId]);

  useEffect(() => {
    if (!gameCode) return;

    const checkPubRoute = async () => {
      try {
        const routeData = await getRoute(gameCode);
        setHasPubRoute(routeData.pubs.length > 0);
      } catch {
        setHasPubRoute(false);
      }
    };

    checkPubRoute();
  }, [gameCode]);

  const handleEventNotificationDismiss = useCallback(() => {
    setShowEventNotification(false);
    if (activeEvent) {
      setLastSeenEventId(activeEvent.id);
    }
  }, [activeEvent, setLastSeenEventId]);

  const currentPlayer = players.find(p => p.id === playerId);
  const hasUsedWildcard = currentPlayer?.randomise != null;
  const isHost = playerId !== null && playerId === hostPlayerId;
  const isCompleted = status === 'COMPLETED';

  const holeCount = pars.length || 9;
  const referencePlayer = currentPlayer ?? players[0];
  const currentHole = referencePlayer ? firstUnplayedHole(referencePlayer.scores, holeCount) : 1;

  const getWinners = (): Player[] => {
    if (players.length === 0) return [];
    const best = Math.min(...players.map(p => playerParRelative(p, pars)));
    return players.filter(p => playerParRelative(p, pars) === best);
  };

  if (error) {
    return (
      <main className="min-h-full flex flex-col items-center justify-center p-4 gap-4">
        <ErrorMessage
          message={error}
          variant="card"
          action={{ label: "Try Again", onClick: () => { setError(''); setLoading(true); fetchGame(); } }}
        />
        <button onClick={() => router.push('/')} className="text-sm text-[var(--color-text-secondary)] hover:underline">
          Back to Home
        </button>
      </main>
    );
  }

  return (
    <main className="p-4 py-5">
      <div className="max-w-4xl mx-auto space-y-4">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-[var(--color-text-muted)]">
              {gameCode.toUpperCase()} · Hole {currentHole} of {holeCount}
            </p>
            <h1 className="font-display text-[22px] text-[var(--color-text)]">Leaderboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/how-to-play"
              className="flex items-center gap-1.5 h-11 px-3.5 rounded-[10px] bg-[var(--color-surface-inset)] border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)] transition-colors shrink-0"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 3h9l6 6v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="var(--color-primary)" strokeWidth="1.6" />
                <path d="M15 3v6h6" stroke="var(--color-primary)" strokeWidth="1.6" />
              </svg>
              <span className="text-[var(--color-primary)] text-xs font-bold">Rules</span>
            </Link>
            {!isCompleted && (
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-1.5 h-11 px-3.5 rounded-[10px] bg-[var(--color-surface-inset)] border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)] transition-colors shrink-0"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="4" y="4" width="16" height="16" rx="2" stroke="var(--color-primary)" strokeWidth="1.6" />
                  <path d="M8 8h3v3H8zM13 8h3v3h-3zM8 13h3v3H8z" fill="var(--color-primary)" />
                </svg>
                <span className="text-[var(--color-primary)] text-xs font-bold">Invite</span>
              </button>
            )}
          </div>
        </header>

        {connectionError && !isCompleted && (
          <div className="bg-[rgba(224,185,93,0.08)] border border-[var(--color-border-gold)] rounded-xl px-4 py-2 flex items-center justify-between gap-3">
            <p className="text-sm text-[var(--color-accent)]">{connectionError}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-[var(--color-accent)] underline shrink-0"
            >
              Refresh
            </button>
          </div>
        )}

        {isCompleted && (
          <div className="bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 rounded-lg px-4 py-3 text-center">
            <p className="font-semibold text-[var(--color-accent)]">
              <span aria-hidden="true">🏆</span> Game Complete
            </p>
          </div>
        )}

        {activeEvent && !isCompleted && (
          <EventBanner event={activeEvent} />
        )}

        <section>
          {loading ? (
            <ScoreboardSkeleton />
          ) : (
            <Leaderboard
              players={players}
              pars={pars}
              currentPlayerId={playerId ?? undefined}
              hostPlayerId={hostPlayerId ?? undefined}
            />
          )}
        </section>

        <nav className="space-y-2.5 pt-2">
          {playerId && !isCompleted && (
            <>
              <Link
                href="/submit-score"
                className="block w-full py-[19px] px-4 btn-gradient text-center text-[19px] rounded-2xl"
              >
                LOG YOUR SIPS
              </Link>
              <div className="flex gap-2.5">
                {hasUsedWildcard ? (
                  <div
                    role="status"
                    aria-label="Wildcard already used for this game"
                    className="flex-1 py-3.5 px-4 glass text-center font-semibold text-[13.5px] rounded-[14px] text-[var(--color-text-faint)] cursor-not-allowed opacity-60"
                  >
                    Wildcard Used
                  </div>
                ) : (
                  <Link
                    href="/randomise"
                    aria-label="Go to wildcard page"
                    className="flex-1 py-3.5 px-4 glass text-center font-semibold text-[13.5px] rounded-[14px] hover:bg-[var(--color-surface-hover)] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" stroke="var(--color-primary)" strokeWidth="1.6" />
                      <path d="M12 3v18M3 12h18" stroke="var(--color-primary)" strokeWidth="1.6" />
                    </svg>
                    Wildcard
                  </Link>
                )}
                {isHost && (
                  <Link
                    href={`/game/${gameCode.toLowerCase()}/host`}
                    className="flex-1 py-3.5 px-4 text-center font-bold text-[13.5px] rounded-[14px] bg-[var(--color-surface-inset)] border border-[var(--color-border-gold)] text-[var(--color-accent)] hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    Host Panel
                  </Link>
                )}
              </div>
            </>
          )}
          {hasPubRoute && (
            <Link
              href="/game/map"
              className="block py-3 px-4 glass text-center font-semibold text-[13.5px] rounded-[14px] hover:bg-[var(--color-surface-hover)] transition-colors text-[var(--color-text-secondary)]"
            >
              See Route
            </Link>
          )}
        </nav>
      </div>

      <AnimatePresence>
        {showShareModal && (
          <ShareModal
            gameCode={gameCode}
            onClose={() => setShowShareModal(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCelebration && isCompleted && (
          <CelebrationScreen
            winners={getWinners()}
            onDismiss={() => setShowCelebration(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEventNotification && activeEvent && (
          <EventNotificationOverlay
            event={activeEvent}
            onDismiss={handleEventNotificationDismiss}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
