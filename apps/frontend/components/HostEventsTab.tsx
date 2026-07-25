'use client';

import type { ActiveEvent, GameEvent } from '@/lib/types';
import { EventCard } from './EventCard';
import { EmptyState } from './ui/EmptyState';

interface HostEventsTabProps {
  events: GameEvent[];
  activeEvent: ActiveEvent | null;
  activatingEventId: string | null;
  onActivate: (event: GameEvent) => void;
  onOpenCustomEvent: () => void;
}

/**
 * What a host lands on when opening the panel mid-game: trigger a preset or a one-off
 * event without navigating past course setup.
 */
export function HostEventsTab({
  events,
  activeEvent,
  activatingEventId,
  onActivate,
  onOpenCustomEvent,
}: HostEventsTabProps) {
  // The backend rejects a second activation rather than replacing the live event, so
  // the host has to end the current one first.
  const eventLive = activeEvent !== null;

  return (
    <div className="flex flex-col gap-[18px]">
      <section>
        <h2 className="eyebrow mb-2 text-[11.5px] text-[var(--color-text-muted)]">
          Trigger an Event
        </h2>
        {events.length === 0 ? (
          <EmptyState icon="📝" description="No events configured for this game yet" />
        ) : (
          <div className="flex flex-col gap-2">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isActive={activeEvent?.id === event.id}
                isOtherEventActive={eventLive && activeEvent.id !== event.id}
                onActivate={() => onActivate(event)}
                isLoading={activatingEventId === event.id}
              />
            ))}
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={onOpenCustomEvent}
        disabled={eventLive}
        title={eventLive ? 'End the current event first' : undefined}
        className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-[var(--color-border-gold)] py-3.5 text-[13px] font-bold text-[var(--color-accent)] hover:bg-[var(--color-surface-inset)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
        Custom Event
      </button>
    </div>
  );
}
