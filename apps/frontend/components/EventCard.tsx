'use client';

import { GameEvent } from '@/lib/types';

interface EventCardProps {
  event: GameEvent;
  isActive: boolean;
  isOtherEventActive: boolean;
  onActivate: () => void;
  isLoading: boolean;
}

export function EventCard({
  event,
  isActive,
  isOtherEventActive,
  onActivate,
  isLoading,
}: EventCardProps) {
  const isDisabled = isLoading || isOtherEventActive;

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-[14px] px-4 py-3.5 ${
        isActive
          ? 'bg-[rgba(201,162,75,0.1)] border-[1.5px] border-[var(--color-accent)]'
          : 'glass'
      }`}
    >
      <div className="min-w-0">
        <h3 className="text-[var(--color-text)] font-semibold text-[14.5px]">{event.title}</h3>
        <p className="text-[var(--color-text-muted)] text-[11.5px] mt-0.5">{event.description}</p>
      </div>

      {isActive ? (
        <span className="shrink-0 px-3.5 py-1.5 rounded-[9px] bg-[var(--color-accent)] text-[var(--color-ink)] font-bold text-xs whitespace-nowrap">
          Active
        </span>
      ) : (
        <button
          onClick={onActivate}
          disabled={isDisabled}
          className={`shrink-0 min-h-[44px] px-[18px] rounded-[10px] font-bold text-[13px] whitespace-nowrap transition-all ${
            isDisabled
              ? 'bg-[var(--color-surface-inset)] border border-[var(--color-border-subtle)] text-[var(--color-text-faint)] cursor-not-allowed opacity-60'
              : 'bg-[var(--color-surface-inset)] border border-[var(--color-border-gold)] text-[var(--color-accent)] hover:bg-[var(--color-surface-hover)]'
          }`}
        >
          {isLoading ? 'Activating...' : 'Activate'}
        </button>
      )}
    </div>
  );
}
