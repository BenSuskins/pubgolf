'use client';

import { useEffect } from 'react';
import { ActiveEvent } from '@/lib/types';

interface EventNotificationOverlayProps {
  event: ActiveEvent;
  onDismiss: () => void;
}

export function EventNotificationOverlay({ event, onDismiss }: EventNotificationOverlayProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleClick = () => {
    onDismiss();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      onDismiss();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 cursor-pointer"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Tap to dismiss"
    >
      <div className="text-center space-y-4 p-8 max-w-md animate-fade-in">
        <div className="text-6xl">
          📣
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] text-[var(--color-accent)]">
            {event.title}
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)]">
            {event.description}
          </p>
        </div>

        <p className="text-[var(--color-text-secondary)] text-sm animate-pulse">
          Tap anywhere to dismiss
        </p>
      </div>
    </div>
  );
}
