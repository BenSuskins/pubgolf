'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { RouteHole } from '@/lib/types';
import { AddRouteSheet } from './AddRouteSheet';
import { ErrorMessage } from './ui/ErrorMessage';

const MIN_PAR = 1;
const MAX_PAR = 10;
const MAX_ROUTES = 4;
const MAX_ROUTE_NAME_LENGTH = 40;
const MAX_DRINK_LENGTH = 100;

interface CourseEditorProps {
  /** The game's current course, as served with game state. */
  holes: RouteHole[];
  /** Resolves once the course is saved; rejects with a message to display. */
  onSave: (holes: RouteHole[]) => Promise<void>;
  disabled?: boolean;
}

// Editing keeps route names in a list and drinks in a parallel matrix so a route
// can be renamed without losing its column, which a Record<name, drink> would.
interface DraftHole {
  hole: number;
  par: number;
  drinks: string[];
}

interface Draft {
  routeNames: string[];
  holes: DraftHole[];
}

function toDraft(holes: RouteHole[]): Draft {
  const routeNames = Object.keys(holes[0]?.drinks ?? {});
  return {
    routeNames,
    holes: holes.map((hole) => ({
      hole: hole.hole,
      par: hole.par,
      drinks: routeNames.map((name) => hole.drinks[name] ?? ''),
    })),
  };
}

function toRouteHoles(draft: Draft): RouteHole[] {
  return draft.holes.map((hole) => ({
    hole: hole.hole,
    par: hole.par,
    drinks: Object.fromEntries(
      draft.routeNames.map((name, index) => [name.trim(), hole.drinks[index].trim()])
    ),
  }));
}

// Mirrors the backend's InvalidCourseFailure rules so the host sees the problem
// before a round trip.
function validate(draft: Draft): string | null {
  const names = draft.routeNames.map((name) => name.trim());
  if (names.length === 0) {
    return 'Add at least one route';
  }
  if (names.some((name) => name.length === 0)) {
    return 'Every route needs a name';
  }
  if (new Set(names.map((name) => name.toLowerCase())).size !== names.length) {
    return 'Route names must be unique';
  }
  for (const hole of draft.holes) {
    if (hole.par < MIN_PAR || hole.par > MAX_PAR) {
      return `Par for hole ${hole.hole} must be between ${MIN_PAR} and ${MAX_PAR}`;
    }
    if (hole.drinks.some((drink) => drink.trim().length === 0)) {
      return `Every route needs a drink for hole ${hole.hole}`;
    }
  }
  return null;
}

function PencilIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="opacity-85">
      <path
        d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CourseEditor({ holes, onSave, disabled = false }: CourseEditorProps) {
  const initial = useMemo(() => toDraft(holes), [holes]);
  // The draft deliberately survives incoming game-state updates so an edit in
  // progress is never wiped; Reset pulls the latest saved course back in.
  const [draft, setDraft] = useState<Draft>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  // Which route's drink column the table is showing. Par never changes with it.
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [renamingRoute, setRenamingRoute] = useState<number | null>(null);
  const [addRouteOpen, setAddRouteOpen] = useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const busy = saving || disabled;
  const selectedRouteName = draft.routeNames[selectedRoute] ?? '';

  const update = (next: Draft) => {
    setDraft(next);
    setSaved(false);
    setError('');
  };

  const renameRoute = (index: number, name: string) => {
    update({
      ...draft,
      routeNames: draft.routeNames.map((existing, i) => (i === index ? name : existing)),
    });
  };

  const addRoute = (name: string, drinks: string[]) => {
    update({
      routeNames: [...draft.routeNames, name],
      holes: draft.holes.map((hole, index) => ({
        ...hole,
        drinks: [...hole.drinks, drinks[index] ?? ''],
      })),
    });
    setSelectedRoute(draft.routeNames.length);
    setAddRouteOpen(false);
  };

  const removeRoute = (index: number) => {
    update({
      routeNames: draft.routeNames.filter((_, i) => i !== index),
      holes: draft.holes.map((hole) => ({
        ...hole,
        drinks: hole.drinks.filter((_, i) => i !== index),
      })),
    });
    setRenamingRoute(null);
    // Keep pointing at the same route where possible, and never past the new end.
    const lastIndex = draft.routeNames.length - 2;
    setSelectedRoute((current) => Math.min(current > index ? current - 1 : current, lastIndex));
  };

  const setPar = (holeIndex: number, par: number) => {
    update({
      ...draft,
      holes: draft.holes.map((hole, i) => (i === holeIndex ? { ...hole, par } : hole)),
    });
  };

  const setDrink = (holeIndex: number, routeIndex: number, drink: string) => {
    update({
      ...draft,
      holes: draft.holes.map((hole, i) =>
        i === holeIndex
          ? { ...hole, drinks: hole.drinks.map((existing, j) => (j === routeIndex ? drink : existing)) }
          : hole
      ),
    });
  };

  // Tap a route to view it, tap the selected one again to rename it.
  const handleChipClick = (index: number) => {
    if (index === selectedRoute) {
      setRenamingRoute(index);
    } else {
      setSelectedRoute(index);
      setRenamingRoute(null);
    }
  };

  const handleSave = async () => {
    const validationError = validate(draft);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setSaving(true);
    try {
      await onSave(toRouteHoles(draft));
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save drinks and pars');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="glass flex min-h-0 flex-1 flex-col rounded-2xl p-3.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="eyebrow text-[var(--color-text-muted)]">Drinks &amp; Pars</h2>
          <span className="text-[10.5px] text-[var(--color-text-muted)]">
            Par is shared across routes
          </span>
        </div>
        <p className="mt-0.5 mb-2.5 text-[11px] text-[var(--color-text-faint)]">
          Tap a route to view it · tap again to rename · + to add one
        </p>

        <div className="mb-2.5 flex gap-1.5 overflow-x-auto border-b border-[var(--color-border)] pb-2.5">
          {draft.routeNames.map((name, index) => {
            const isSelected = index === selectedRoute;

            if (isSelected && renamingRoute === index) {
              return (
                <input
                  key={index}
                  autoFocus
                  value={name}
                  onChange={(e) => renameRoute(index, e.target.value)}
                  onBlur={() => setRenamingRoute(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') setRenamingRoute(null);
                  }}
                  maxLength={MAX_ROUTE_NAME_LENGTH}
                  disabled={busy}
                  aria-label={`Route ${index + 1} name`}
                  className="w-[9.5rem] flex-shrink-0 rounded-lg border border-[var(--color-border-gold)] bg-[var(--color-bg)] px-2.5 py-[5px] text-[11px] font-bold text-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              );
            }

            return (
              <span
                key={index}
                className={`flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border text-[11px] font-bold ${
                  isSelected
                    ? 'border-[var(--color-border-gold)] bg-[var(--color-chip-active)] pl-2.5 pr-2 text-[var(--color-accent)]'
                    : 'border-[var(--color-border-subtle)] bg-[var(--color-bg)] px-2.5 text-[var(--color-text-secondary)]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleChipClick(index)}
                  disabled={busy}
                  aria-pressed={isSelected}
                  title={isSelected ? `Rename ${name}` : `View ${name}`}
                  className="flex items-center gap-1.5 py-[5px] disabled:opacity-60"
                >
                  {name || `Route ${index + 1}`}
                  {isSelected && <PencilIcon />}
                </button>
                {isSelected && draft.routeNames.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRoute(index)}
                    disabled={busy}
                    aria-label={`Remove ${name || `route ${index + 1}`}`}
                    className="py-[5px] text-[var(--color-text-muted)] hover:text-[var(--color-error)] disabled:opacity-60"
                  >
                    ✕
                  </button>
                )}
              </span>
            );
          })}

          {draft.routeNames.length < MAX_ROUTES && (
            <button
              type="button"
              onClick={() => setAddRouteOpen(true)}
              disabled={busy}
              className="flex-shrink-0 whitespace-nowrap rounded-lg border border-dashed border-[var(--color-border-outline)] bg-[var(--color-bg)] px-2.5 py-[5px] text-[11px] font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] disabled:opacity-60"
            >
              + Route
            </button>
          )}
        </div>

        <div className="grid grid-cols-[16px_1fr_34px] gap-x-2.5 border-b border-[var(--color-border)] pb-1.5 text-[9.5px] uppercase tracking-[0.05em] text-[var(--color-text-faint)]">
          <span />
          <span className="text-[var(--color-accent)]">{selectedRouteName} — drink names</span>
          <span className="text-right text-[var(--color-accent)]">Par</span>
        </div>

        <ul className="flex-1 overflow-y-auto">
          {draft.holes.map((hole, holeIndex) => (
            <li
              key={hole.hole}
              className="grid grid-cols-[16px_1fr_34px] items-center gap-x-2.5 border-b border-[var(--color-border-subtle)]/60 py-1.5 last:border-b-0"
            >
              <span className="font-display text-xs text-[var(--color-primary)]" aria-hidden="true">
                {hole.hole}
              </span>
              <input
                value={hole.drinks[selectedRoute] ?? ''}
                onChange={(e) => setDrink(holeIndex, selectedRoute, e.target.value)}
                maxLength={MAX_DRINK_LENGTH}
                placeholder="Drink"
                disabled={busy}
                aria-label={`Hole ${hole.hole} drink on ${selectedRouteName || `route ${selectedRoute + 1}`}`}
                className="min-w-0 border-none bg-transparent py-1 text-xs text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:text-[var(--color-text)] disabled:opacity-60"
              />
              <input
                type="number"
                min={MIN_PAR}
                max={MAX_PAR}
                value={hole.par}
                onChange={(e) => setPar(holeIndex, Number(e.target.value))}
                disabled={busy}
                aria-label={`Hole ${hole.hole} par`}
                className="w-full border-none bg-transparent py-1 text-right text-xs font-bold text-[var(--color-accent)] [appearance:textfield] focus:outline-none disabled:opacity-60 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </li>
          ))}
        </ul>
      </div>

      {error && <ErrorMessage message={error} variant="inline" />}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={disabled || saving || !dirty}
          className="btn-gradient w-full rounded-[14px] py-4 text-base disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {saving ? 'SAVING...' : 'SAVE COURSE'}
        </button>
        {dirty && !saving && (
          <button
            type="button"
            onClick={() => {
              update(initial);
              setSelectedRoute(0);
              setRenamingRoute(null);
            }}
            disabled={busy}
            className="self-center text-[12.5px] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
          >
            Reset
          </button>
        )}
        {saved && !dirty && (
          <p className="self-center text-[12.5px] text-[var(--color-accent)]" role="status">
            Saved — all players updated
          </p>
        )}
      </div>

      <AnimatePresence>
        {addRouteOpen && (
          <AddRouteSheet
            pars={draft.holes.map((hole) => hole.par)}
            existingNames={draft.routeNames}
            maxNameLength={MAX_ROUTE_NAME_LENGTH}
            maxDrinkLength={MAX_DRINK_LENGTH}
            onCreate={addRoute}
            onClose={() => setAddRouteOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
