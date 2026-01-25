'use client';

import { GameEvent } from '@/lib/types';
import { Card } from './ui/Card';
import { Typography } from './ui/Typography';

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
    <Card
      padding="sm"
      className={`transition-all ${
        isActive
          ? 'ring-2 ring-[var(--color-accent)] bg-[var(--color-accent)]/10'
          : ''
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Typography variant="subheading" as="h3">
            {event.title}
          </Typography>
          {isActive && (
            <span className="text-xs bg-[var(--color-accent)] text-black px-2 py-0.5 rounded-full font-medium">
              Active
            </span>
          )}
        </div>

        <Typography variant="small" color="secondary">
          {event.description}
        </Typography>

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
    </Card>
  );
}
