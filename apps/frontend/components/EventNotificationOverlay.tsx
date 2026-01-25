'use client';

import { useEffect } from 'react';
import { ActiveEvent } from '@/lib/types';
import { Typography } from './ui/Typography';

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
          <Typography variant="display" as="h1" color="accent" className="text-3xl">
            {event.title}
          </Typography>
          <Typography variant="subheading" color="secondary">
            {event.description}
          </Typography>
        </div>

        <Typography variant="small" color="secondary" className="animate-pulse">
          Tap anywhere to dismiss
        </Typography>
      </div>
    </div>
  );
}
