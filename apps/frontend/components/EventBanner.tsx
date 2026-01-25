'use client';

import { ActiveEvent } from '@/lib/types';
import { Card } from './ui/Card';
import { Typography } from './ui/Typography';

interface EventBannerProps {
  event: ActiveEvent;
}

export function EventBanner({ event }: EventBannerProps) {
  return (
    <Card variant="accent" padding="sm" className="border-l-4 mb-6 animate-fade-in">
      <div className="flex items-start gap-3">
        <span className="text-2xl" role="img" aria-label="Event">
          📣
        </span>
        <div className="flex-1 min-w-0">
          <Typography variant="heading" as="h3" color="accent">
            {event.title}
          </Typography>
          <Typography variant="small" color="secondary" className="mt-1">
            {event.description}
          </Typography>
        </div>
      </div>
    </Card>
  );
}
