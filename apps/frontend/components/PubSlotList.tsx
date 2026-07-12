'use client';

import { Pub } from '@/lib/types';

interface PubSlotListProps {
  pubs: Pub[];
  onRemove: (index: number) => void;
}

export default function PubSlotList({ pubs, onRemove }: PubSlotListProps) {
  return (
    <div className="space-y-2">
      <h3 className="eyebrow text-[var(--color-text-muted)]">Pub Route ({pubs.length}/9)</h3>
      <ul className="glass rounded-[14px] overflow-hidden" aria-label="Selected pubs">
        {pubs.map((pub, index) => {
          const isLastFilled = index === pubs.length - 1;

          return (
            <li
              key={index}
              className={`flex items-center gap-3 px-3.5 py-3 ${
                index > 0 ? 'border-t border-[var(--color-border)]/50' : ''
              }`}
            >
              <span
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-[var(--color-primary)] text-[var(--color-ink)] rounded-full text-xs font-bold"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <span className="flex-1 truncate text-[13.5px] font-semibold text-[var(--color-text)]">
                {pub.name}
              </span>
              {isLastFilled && (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="flex-shrink-0 px-2.5 py-1.5 text-xs font-bold text-[var(--color-error)] hover:bg-[var(--color-danger-surface)] rounded-lg transition-colors"
                  aria-label={`Remove ${pub.name}`}
                >
                  Remove
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
