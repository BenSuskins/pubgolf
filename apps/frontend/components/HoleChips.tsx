'use client';

import { hasPlayedHole } from '@/lib/scoring';

export interface HoleChipsProps {
  holeCount?: number;
  selectedHole: number;
  scores: (number | null)[];
  pars: number[];
  onSelect: (hole: number) => void;
  disabled?: boolean;
}

function chipClasses(isSelected: boolean, score: number | null, par: number | undefined): string {
  if (isSelected) {
    return 'min-w-[42px] py-[13px] text-[14.5px] bg-gradient-to-b from-[var(--color-accent)] to-[var(--color-primary)] text-[var(--color-ink)] shadow-[0_6px_14px_-6px_var(--color-glow)]';
  }
  if (!hasPlayedHole(score)) {
    return 'min-w-[38px] py-3 text-[13px] bg-[var(--color-surface-inset)] border border-dashed border-[var(--color-border)] text-[var(--color-text-faintest)]';
  }
  const playedScore = score as number;
  const scoreColor =
    par === undefined || playedScore === par
      ? 'text-[var(--color-text)]'
      : playedScore < par
        ? 'text-[var(--color-success)]'
        : 'text-[var(--color-error)]';
  return `min-w-[38px] py-3 text-[13px] bg-[var(--color-surface)] border border-[var(--color-border)] ${scoreColor}`;
}

export function HoleChips({
  holeCount = 9,
  selectedHole,
  scores,
  pars,
  onSelect,
  disabled = false,
}: HoleChipsProps) {
  return (
    <div>
      <div className="eyebrow text-[var(--color-text-muted)] mb-2">Jump to hole</div>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5" role="group" aria-label="Jump to hole">
        {Array.from({ length: holeCount }, (_, index) => index + 1).map((hole) => {
          const score = scores[hole - 1] ?? null;
          const isSelected = hole === selectedHole;
          return (
            <button
              key={hole}
              type="button"
              onClick={() => onSelect(hole)}
              disabled={disabled}
              aria-pressed={isSelected}
              aria-label={`Hole ${hole}${hasPlayedHole(score) ? `, ${score} sips logged` : ', not played'}`}
              className={`font-display text-center rounded-[9px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${chipClasses(
                isSelected,
                score,
                pars[hole - 1]
              )}`}
            >
              {hole}
            </button>
          );
        })}
      </div>
      <p className="text-[10.5px] text-[var(--color-text-faint)] mt-1.5">
        Green = logged under par · red = over par · tap any played hole to edit it
      </p>
    </div>
  );
}
