'use client';

import { Player } from '@/lib/types';

interface CelebrationScreenProps {
  winners: Player[];
  onDismiss: () => void;
}

export function CelebrationScreen({ winners, onDismiss }: CelebrationScreenProps) {
  const handleClick = () => {
    onDismiss();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onDismiss();
    }
  };

  const winnerNames = winners.map(w => w.name).join(' & ');
  const isTie = winners.length > 1;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 cursor-pointer"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Tap to view full results"
    >
      <div className="text-center space-y-6 p-8 animate-fade-in">
        <div className="text-8xl">
          🏆
        </div>

        <div className="space-y-2">
          <p className="text-[var(--color-text-secondary)] text-lg">
            {isTie ? 'Winners' : 'Winner'}
          </p>
          <h1 className="text-4xl font-bold font-[family-name:var(--font-display)] text-[var(--color-accent)]">
            {winnerNames}
          </h1>
          {winners.length > 0 && (
            <p className="text-2xl font-semibold">
              {winners[0].totalScore} sips
            </p>
          )}
        </div>

        <p className="text-[var(--color-text-secondary)] text-sm animate-pulse">
          Tap anywhere to view results
        </p>
      </div>
    </div>
  );
}
