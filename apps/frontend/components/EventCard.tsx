'use client';

import { Event } from '@/lib/types';

interface EventCardProps {
  event: Event;
  isActive: boolean;
  isDisabled: boolean;
  onSelect: () => void;
  onEndEvent: () => void;
}

export function EventCard({
  event,
  isActive,
  isDisabled,
  onSelect,
  onEndEvent,
}: EventCardProps) {
  const handleClick = () => {
    if (!isDisabled && !isActive) {
      onSelect();
    }
  };

  const handleEndClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEndEvent();
  };

  return (
    <div
      className={`
        glass rounded-xl p-4 transition-all cursor-pointer
        ${isActive ? 'ring-2 ring-[var(--color-accent)]' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5'}
      `}
      onClick={handleClick}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <h3 className="font-bold text-lg">{event.name}</h3>
      <p className="text-sm text-[var(--color-text-secondary)] mt-1">{event.description}</p>

      {isActive && (
        <button
          onClick={handleEndClick}
          className="mt-3 px-3 py-1.5 text-sm border border-[var(--color-danger)]/30 text-[var(--color-danger)] rounded-lg hover:bg-[var(--color-danger)]/10 transition-colors"
        >
          End Event
        </button>
      )}
    </div>
  );
}
