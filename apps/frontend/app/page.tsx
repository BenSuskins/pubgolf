'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CreateGameForm } from '@/components/CreateGameForm';
import { JoinGameForm } from '@/components/JoinGameForm';
import { GolfBallLogo } from '@/components/GolfBallLogo';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Card } from '@/components/ui/Card';
import { getGameState, ApiError } from '@/lib/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';

type Mode = 'host' | 'join';

function ResumeBanner() {
  const [resumeCode, setResumeCode] = useState<string | null>(null);
  const { getGameCode, getPlayerId, clearSession } = useLocalStorage();

  useEffect(() => {
    const code = getGameCode();
    const playerId = getPlayerId();
    if (!code || !playerId) return;

    let cancelled = false;
    getGameState(code)
      .then((state) => {
        if (cancelled) return;
        const stillInGame = state.players.some((player) => player.id === playerId);
        if (state.status === 'ACTIVE' && stillInGame) {
          setResumeCode(state.gameCode);
        } else if (!stillInGame) {
          clearSession();
        }
      })
      .catch((err) => {
        if (!cancelled && err instanceof ApiError && err.status === 404) {
          clearSession();
        }
      });
    return () => {
      cancelled = true;
    };
  }, [getGameCode, getPlayerId, clearSession]);

  if (!resumeCode) return null;

  return (
    <Link
      href="/game"
      className="block glass rounded-[14px] px-4 py-3 text-center border border-[var(--color-border-gold)] hover:bg-[var(--color-surface-hover)] transition-colors"
    >
      <span className="text-[13px] text-[var(--color-text-secondary)]">You&apos;re in round </span>
      <span className="font-display text-[15px] tracking-[0.06em] text-[var(--color-accent)]">
        {resumeCode.toUpperCase()}
      </span>
      <span className="text-[13px] text-[var(--color-text-secondary)]"> — resume →</span>
    </Link>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const hasGameCode = searchParams.get('gameCode');
  const [mode, setMode] = useState<Mode>(hasGameCode ? 'join' : 'host');

  return (
    <div className="w-full max-w-md space-y-5">
      <div className="text-center pt-6">
        <GolfBallLogo size={72} className="mx-auto mb-4" />
        <h1 className="font-display text-[52px] leading-[0.95] text-[var(--color-text)]">
          PUB
          <br />
          GOLF
        </h1>
        <div className="flex items-center justify-center gap-2.5 mt-3.5">
          <span className="h-px w-7 bg-[var(--color-border-subtle)]" aria-hidden="true" />
          <span className="eyebrow text-[var(--color-text-secondary)]">
            9 Holes · 9 Rounds · 1 Champion
          </span>
          <span className="h-px w-7 bg-[var(--color-border-subtle)]" aria-hidden="true" />
        </div>
      </div>

      <ResumeBanner />

      <SegmentedControl<Mode>
        ariaLabel="Host or join a round"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'host', label: 'Host a Round' },
          { value: 'join', label: 'Join a Round' },
        ]}
      />

      <Card as="section" padding="lg" rounded="xl">
        {mode === 'host' ? <CreateGameForm /> : <JoinGameForm />}
      </Card>

      <div className="text-center">
        <Link
          href="/how-to-play"
          className="text-[13px] text-[var(--color-text-muted)] border-b border-dashed border-[var(--color-border-subtle)] pb-0.5 hover:text-[var(--color-text-secondary)] transition-colors"
        >
          First time? Learn the rules
        </Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <section className="min-h-full flex flex-col items-center justify-start bg-ambient p-6 pb-12">
      <Suspense
        fallback={
          <div className="text-[var(--color-text-secondary)] animate-pulse">Loading...</div>
        }
      >
        <HomeContent />
      </Suspense>
    </section>
  );
}
