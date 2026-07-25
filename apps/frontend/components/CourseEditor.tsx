'use client';

import { useMemo, useState } from 'react';
import type { RouteHole } from '@/lib/types';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
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

export function CourseEditor({ holes, onSave, disabled = false }: CourseEditorProps) {
  const initial = useMemo(() => toDraft(holes), [holes]);
  // The draft deliberately survives incoming game-state updates so an edit in
  // progress is never wiped; Reset pulls the latest saved course back in.
  const [draft, setDraft] = useState<Draft>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

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

  const addRoute = () => {
    update({
      routeNames: [...draft.routeNames, `Route ${String.fromCharCode(65 + draft.routeNames.length)}`],
      holes: draft.holes.map((hole) => ({ ...hole, drinks: [...hole.drinks, ''] })),
    });
  };

  const removeRoute = (index: number) => {
    update({
      routeNames: draft.routeNames.filter((_, i) => i !== index),
      holes: draft.holes.map((hole) => ({
        ...hole,
        drinks: hole.drinks.filter((_, i) => i !== index),
      })),
    });
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

  const busy = saving || disabled;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        {draft.routeNames.map((name, index) => (
          <div key={index} className="flex items-end gap-1">
            <Input
              size="sm"
              value={name}
              onChange={(e) => renameRoute(index, e.target.value)}
              maxLength={MAX_ROUTE_NAME_LENGTH}
              disabled={busy}
              aria-label={`Route ${index + 1} name`}
              className="w-[9.5rem]"
            />
            {draft.routeNames.length > 1 && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => removeRoute(index)}
                disabled={busy}
                ariaLabel={`Remove ${name || `route ${index + 1}`}`}
              >
                ✕
              </Button>
            )}
          </div>
        ))}
        {draft.routeNames.length < MAX_ROUTES && (
          <Button variant="secondary" size="sm" onClick={addRoute} disabled={busy}>
            + Route
          </Button>
        )}
      </div>

      <ul className="space-y-2">
        {draft.holes.map((hole, holeIndex) => (
          <li
            key={hole.hole}
            className="glass rounded-[14px] p-3 flex flex-wrap items-end gap-2"
          >
            <span className="font-display text-[var(--color-primary)] w-5 pb-3" aria-hidden="true">
              {hole.hole}
            </span>
            {hole.drinks.map((drink, routeIndex) => (
              <Input
                key={routeIndex}
                size="sm"
                value={drink}
                onChange={(e) => setDrink(holeIndex, routeIndex, e.target.value)}
                maxLength={MAX_DRINK_LENGTH}
                placeholder="Drink"
                disabled={busy}
                aria-label={`Hole ${hole.hole} drink on ${draft.routeNames[routeIndex] || `route ${routeIndex + 1}`}`}
                className="w-[9.5rem]"
              />
            ))}
            <Input
              size="sm"
              type="number"
              min={MIN_PAR}
              max={MAX_PAR}
              value={hole.par}
              onChange={(e) => setPar(holeIndex, Number(e.target.value))}
              disabled={busy}
              aria-label={`Hole ${hole.hole} par`}
              className="w-[4.5rem]"
            />
          </li>
        ))}
      </ul>

      {error && <ErrorMessage message={error} variant="inline" />}

      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" onClick={handleSave} loading={saving} disabled={disabled || !dirty}>
          {saving ? 'Saving...' : 'Save Drinks & Pars'}
        </Button>
        {dirty && !saving && (
          <Button variant="ghost" size="sm" onClick={() => update(initial)} disabled={busy}>
            Reset
          </Button>
        )}
        {saved && !dirty && (
          <p className="text-[12.5px] text-[var(--color-accent)]" role="status">
            Saved — all players updated
          </p>
        )}
      </div>
    </div>
  );
}
