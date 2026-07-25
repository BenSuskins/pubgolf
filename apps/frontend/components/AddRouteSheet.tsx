'use client';

import { useState } from 'react';
import { BottomSheet } from './ui/BottomSheet';
import { ErrorMessage } from './ui/ErrorMessage';

interface AddRouteSheetProps {
  /** The game's shared par, one per hole - shown but never editable here. */
  pars: number[];
  /** Existing route names, for the uniqueness check. */
  existingNames: string[];
  maxNameLength: number;
  maxDrinkLength: number;
  /** Adds the route to the in-progress course; it is persisted by Save Course. */
  onCreate: (name: string, drinks: string[]) => void;
  onClose: () => void;
}

/**
 * "+ Route" opens this rather than navigating away, so adding a route never feels like
 * leaving course setup. Par is inherited from the game and rendered read-only - that is
 * what makes "par is shared, only the drinks differ" concrete rather than implied.
 */
export function AddRouteSheet({
  pars,
  existingNames,
  maxNameLength,
  maxDrinkLength,
  onCreate,
  onClose,
}: AddRouteSheetProps) {
  const [name, setName] = useState('');
  const [drinks, setDrinks] = useState<string[]>(() => pars.map(() => ''));
  const [error, setError] = useState('');

  const handleCreate = () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError('Give the route a name');
      return;
    }
    if (existingNames.some((existing) => existing.trim().toLowerCase() === trimmed.toLowerCase())) {
      setError('Route names must be unique');
      return;
    }
    onCreate(trimmed, drinks);
  };

  const setDrink = (index: number, value: string) => {
    setDrinks(drinks.map((drink, i) => (i === index ? value : drink)));
    setError('');
  };

  return (
    <BottomSheet
      title="New Route"
      description={`Give it a name — it'll use the same ${pars.length}-hole par (${pars.join(', ')}) as your other routes. Just fill in what each hole is on this route.`}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="btn-outline flex-1 rounded-xl py-3.5 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="btn-gradient flex-[1.4] rounded-xl py-3.5 text-sm"
          >
            CREATE ROUTE
          </button>
        </>
      }
    >
      <label
        htmlFor="new-route-name"
        className="mb-1.5 block text-[10.5px] uppercase tracking-[0.05em] text-[var(--color-text-faint)]"
      >
        Route name
      </label>
      <input
        id="new-route-name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError('');
        }}
        maxLength={maxNameLength}
        placeholder="e.g. Wine Walk"
        className="mb-3.5 w-full rounded-[10px] border border-[var(--color-border-gold)] bg-[var(--color-bg)] px-3.5 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      />

      <p className="mb-1.5 text-[10.5px] uppercase tracking-[0.05em] text-[var(--color-text-faint)]">
        Drinks (par carries over)
      </p>
      <div className="flex flex-col gap-1.5">
        {pars.map((par, index) => (
          <div
            key={index}
            className="grid grid-cols-[16px_1fr_26px] items-center gap-x-2.5 rounded-lg bg-[var(--color-bg)] px-2.5 py-2"
          >
            <span className="font-display text-xs text-[var(--color-primary)]" aria-hidden="true">
              {index + 1}
            </span>
            <input
              value={drinks[index]}
              onChange={(e) => setDrink(index, e.target.value)}
              maxLength={maxDrinkLength}
              placeholder={`Drink for hole ${index + 1}`}
              aria-label={`New route drink for hole ${index + 1}`}
              className="min-w-0 border-none bg-transparent text-xs text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-faint)] focus:outline-none"
            />
            <span
              className="text-right text-xs font-bold text-[var(--color-text-faint)]"
              aria-label={`Hole ${index + 1} par is ${par}, shared across routes`}
            >
              {par}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-3">
          <ErrorMessage message={error} variant="inline" />
        </div>
      )}
    </BottomSheet>
  );
}
