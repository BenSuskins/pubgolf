'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CreateGameForm } from '@/components/CreateGameForm';
import { JoinGameForm } from '@/components/JoinGameForm';
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

export function HomeGameEntry() {
  const searchParams = useSearchParams();
  const hasGameCode = searchParams.get('gameCode');
  const [mode, setMode] = useState<Mode>(hasGameCode ? 'join' : 'host');

  return (
    <div className="space-y-5">
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
    </div>
  );
}
