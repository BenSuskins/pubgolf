'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { AnimatePresence } from 'motion/react';
import { getGameState, getRoute } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSessionStorage } from '@/hooks/useSessionStorage';
import { useGameStream } from '@/hooks/useGameStream';
import { Leaderboard } from '@/components/Leaderboard';
import { ScoreboardSkeleton } from '@/components/ScoreboardSkeleton';
import { ShareModal } from '@/components/ShareModal';
import { CelebrationScreen } from '@/components/CelebrationScreen';
import { EventNotificationOverlay } from '@/components/EventNotificationOverlay';
import { EventBanner } from '@/components/EventBanner';
import { Player, GameState } from '@/lib/types';
import { firstUnplayedHole, playerParRelative } from '@/lib/scoring';
import { GAME_RULES_HREF } from '@/lib/constants';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

export default function GameScreen({ initialGame, initialGameCode, initialPlayerId }: { initialGame: GameState; initialGameCode: string; initialPlayerId: string }) {
  const [committedGameState, setCommittedGameState] = useState<GameState | null>(initialGame);
  const [gameCode, setGameCode] = useState<string>(initialGameCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(initialGame.status === 'COMPLETED');
  const [showEventNotification, setShowEventNotification] = useState(false);
  const [hasPubRoute, setHasPubRoute] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(initialPlayerId);
  const previousEventIdRef = useRef<string | null>(null);
  const gameStateRevisionRef = useRef(0);
  const router = useRouter();
  const { getGameCode, getPlayerId } = useLocalStorage();
  const { getLastSeenEventId, setLastSeenEventId, getQueuedEventId, setQueuedEventId } =
    useSessionStorage();

  const players = committedGameState?.players || [];
  const status = committedGameState?.status || 'ACTIVE';
  const hostPlayerId = committedGameState?.hostPlayerId || null;
  const activeEvent = committedGameState?.activeEvent || null;
  // The course comes with game state, so a host's par edit re-ranks the board live.
  const pars = (committedGameState?.holes ?? []).map((hole) => hole.par);

  const handleGameStateUpdate = useCallback(
    (state: GameState) => {
      gameStateRevisionRef.current += 1;
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

      const queuedEventId = getQueuedEventId();
      if (queuedEventId && state.activeEvent?.id === queuedEventId) {
        setShowEventNotification(true);
        setQueuedEventId(null);
      }

      previousEventIdRef.current = newEventId;

      if (state.status === 'COMPLETED') {
        setShowCelebration(true);
      }
      setError('');
    },
    [getLastSeenEventId, getQueuedEventId, setQueuedEventId]
  );

  const fetchGame = useCallback(async () => {
    const code = getGameCode();
    if (!code) {
      router.push('/play');
      return;
    }

    const revision = gameStateRevisionRef.current;
    try {
      const state = await getGameState(code);
      // A stream snapshot can overtake this request while it is in flight.
      if (gameStateRevisionRef.current === revision) handleGameStateUpdate(state);
    } catch (err) {
      if (gameStateRevisionRef.current === revision) {
        setError(err instanceof Error ? err.message : "Couldn't load the round. Try again.");
      }
    } finally {
      setGameCode(code);
      setPlayerId(getPlayerId());
      setLoading(false);
    }
  }, [getGameCode, getPlayerId, router, handleGameStateUpdate]);

  const { connectionError } = useGameStream({
    gameCode,
    onGameStateUpdate: handleGameStateUpdate,
    onReconnect: fetchGame,
    enabled: !loading && status !== 'COMPLETED',
  });

  useEffect(() => {
    // The request settles before fetchGame updates state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGame();
  }, [fetchGame]);

  // Mobile browsers drop the connection while the phone is locked or backgrounded;
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

  const currentPlayer = players.find((p) => p.id === playerId);
  const hasUsedWildcard = currentPlayer?.randomise != null;
  const isHost = playerId !== null && playerId === hostPlayerId;
  const isCompleted = status === 'COMPLETED';

  const holeCount = pars.length || 9;
  const referencePlayer = currentPlayer ?? players[0];
  const currentHole = referencePlayer ? firstUnplayedHole(referencePlayer.scores, holeCount) : 1;

  const getWinners = (): Player[] => {
    if (players.length === 0) return [];
    const best = Math.min(...players.map((p) => playerParRelative(p, pars)));
    return players.filter((p) => playerParRelative(p, pars) === best);
  };

  if (error) {
    return (
      <main className="min-h-full flex flex-col items-center justify-center p-4 gap-4">
        <ErrorMessage
          message={error}
          variant="card"
          action={{
            label: 'Try Again',
            onClick: () => {
              setError('');
              setLoading(true);
              fetchGame();
            },
          }}
        />
        <button
          onClick={() => router.push('/play')}
          className="text-sm text-[var(--color-text-secondary)] hover:underline"
        >
          Back to Home
        </button>
      </main>
    );
  }

  return (
    <main className="page-container py-5 md:py-8">
      <div className="space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-[var(--color-text-muted)]">
              {gameCode.toUpperCase()} · Hole {currentHole} of {holeCount}
            </p>
            <h1 className="font-display text-[22px] text-[var(--color-text)]">Leaderboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={GAME_RULES_HREF}
              className="flex items-center gap-1.5 h-11 px-3.5 rounded-[10px] bg-[var(--color-surface-inset)] border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)] transition-colors shrink-0"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M6 3h9l6 6v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
                  stroke="var(--color-primary)"
                  strokeWidth="1.6"
                />
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
                  <rect
                    x="4"
                    y="4"
                    width="16"
                    height="16"
                    rx="2"
                    stroke="var(--color-primary)"
                    strokeWidth="1.6"
                  />
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
              <span aria-hidden="true">🏆</span> Round Complete
            </p>
          </div>
        )}

        {activeEvent && !isCompleted && <EventBanner event={activeEvent} />}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,18rem)]">
          <section className="min-w-0">
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

          <nav
            aria-label="Round actions"
            className="space-y-3 lg:sticky lg:top-6 lg:glass lg:rounded-2xl lg:p-4"
          >
            {playerId && !isCompleted && (
              <>
                <Link
                  prefetch={false}
                  href="/submit-score"
                  className="block w-full py-4 px-4 btn-gradient text-center text-[17px] rounded-2xl"
                >
                  LOG YOUR SIPS
                </Link>
                <div className={`grid gap-2.5 ${isHost ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {hasUsedWildcard ? (
                    <div
                      role="status"
                      aria-label="Wildcard already used this round"
                      className="min-w-0 py-3 px-2 glass text-center font-semibold text-[13.5px] rounded-[14px] text-[var(--color-text-faint)] cursor-not-allowed opacity-60"
                    >
                      Wildcard Used
                    </div>
                  ) : (
                    <Link
                      prefetch={false}
                      href="/randomise"
                      aria-label="Go to wildcard page"
                      className="min-w-0 py-3 px-2 glass text-center font-semibold text-[13.5px] rounded-[14px] hover:bg-[var(--color-surface-hover)] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          stroke="var(--color-primary)"
                          strokeWidth="1.6"
                        />
                        <path
                          d="M12 3v18M3 12h18"
                          stroke="var(--color-primary)"
                          strokeWidth="1.6"
                        />
                      </svg>
                      Wildcard
                    </Link>
                  )}
                  {isHost && (
                    <Link
                      href={`/game/${gameCode.toLowerCase()}/host`}
                      className="min-w-0 py-3 px-2 text-center font-bold text-[13.5px] rounded-[14px] bg-[var(--color-surface-inset)] border border-[var(--color-border-gold)] text-[var(--color-accent)] hover:bg-[var(--color-surface-hover)] transition-colors"
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
      </div>

      <AnimatePresence>
        {showShareModal && (
          <ShareModal gameCode={gameCode} onClose={() => setShowShareModal(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCelebration && isCompleted && (
          <CelebrationScreen winners={getWinners()} onDismiss={() => setShowCelebration(false)} />
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
