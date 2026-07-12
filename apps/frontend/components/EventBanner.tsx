'use client';

import { ActiveEvent } from '@/lib/types';

interface EventBannerProps {
  event: ActiveEvent;
}

export function EventBanner({ event }: EventBannerProps) {
  return (
    <div className="surface-gold rounded-xl px-3 py-2.5 flex items-center gap-2.5 animate-fade-in">
      <span className="text-[15px]" role="img" aria-label="Event">
        📣
      </span>
      <div className="flex-1 min-w-0">
        <h3 className="text-[var(--color-accent)] font-bold text-[12.5px]">
          {event.title} active
        </h3>
        <p className="text-[#b0a583] text-[10.5px] truncate">{event.description}</p>
      </div>
    </div>
  );
}
