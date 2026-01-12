'use client';

import { ActiveEvent } from '@/lib/types';

interface EventBannerProps {
  event: ActiveEvent;
}

export function EventBanner({ event }: EventBannerProps) {
  return (
    <div className="glass rounded-xl p-4 border-l-4 border-[var(--color-accent)] mb-6 animate-fade-in">
      <div className="flex items-start gap-3">
        <span className="text-2xl" role="img" aria-label="Event">
          📣
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[var(--color-accent)] font-[family-name:var(--font-display)]">
            {event.title}
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {event.description}
          </p>
        </div>
      </div>
    </div>
  );
}
