'use client';

import Link from 'next/link';
import type { PubLocation } from '@/lib/types';

interface RouteMapCardProps {
  /** The game's mapped pubs, in hole order. Empty when no route has been set up. */
  pubs: PubLocation[];
}

/**
 * Summary of the pub route with a link into the route builder. The thumbnail is a
 * placeholder rather than a real map render - swapping it for a static map image is a
 * follow-up, not something the host panel needs to load tiles for.
 */
export function RouteMapCard({ pubs }: RouteMapCardProps) {
  const mapped = pubs.length > 0;

  return (
    <div className="glass rounded-2xl p-3.5">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h2 className="eyebrow text-[var(--color-text-muted)]">Route Map</h2>
        <Link
          href="/game/route"
          className="text-xs font-bold text-[var(--color-accent)] hover:underline"
        >
          {mapped ? 'Edit →' : 'Set up →'}
        </Link>
      </div>

      <div className="flex items-center gap-2.5">
        <svg
          width="52"
          height="52"
          viewBox="0 0 52 52"
          aria-hidden="true"
          className="shrink-0 rounded-[10px] bg-[#16231a]"
        >
          <path
            d="M8 40 C 16 30, 14 22, 24 20 S 38 12, 40 8"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2"
            strokeDasharray="1.5 5"
            strokeLinecap="round"
          />
          <circle cx="8" cy="40" r="3.5" fill="var(--color-primary)" />
          <circle cx="40" cy="8" r="3.5" fill="var(--color-border-subtle)" />
        </svg>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
            {mapped
              ? `${pubs.length} ${pubs.length === 1 ? 'pub' : 'pubs'} mapped`
              : 'No route mapped yet'}
          </p>
          <p className="mt-0.5 truncate text-[11.5px] text-[var(--color-text-muted)]">
            {mapped
              ? `${pubs[0].name} → ${pubs[pubs.length - 1].name}`
              : 'Add pubs so players can find each hole'}
          </p>
        </div>
      </div>
    </div>
  );
}
