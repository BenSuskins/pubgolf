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
      className={`glass rounded-xl p-4 transition-all ${
        isActive
          ? 'ring-2 ring-[var(--color-accent)] bg-[var(--color-accent)]/10'
          : ''
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-lg font-[family-name:var(--font-display)]">
            {event.title}
          </h3>
          {isActive && (
            <span className="text-xs bg-[var(--color-accent)] text-black px-2 py-0.5 rounded-full font-medium">
              Active
            </span>
          )}
        </div>

        <p className="text-sm text-[var(--color-text-secondary)]">
          {event.description}
        </p>

        {!isActive && (
          <button
            onClick={onActivate}
            disabled={isDisabled}
            className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              isDisabled
                ? 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] cursor-not-allowed opacity-50'
                : 'btn-gradient hover:opacity-90'
            }`}
          >
            {isLoading ? 'Activating...' : 'Activate'}
          </button>
        )}
      </div>
    </div>
  );
}
