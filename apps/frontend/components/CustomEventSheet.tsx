'use client';

import { useState } from 'react';
import { BottomSheet } from './ui/BottomSheet';

interface CustomEventSheetProps {
  /** Fires the event immediately; rejects with a message to display. */
  onTrigger: (title: string, description: string) => Promise<void>;
  onClose: () => void;
}

const MAX_TITLE_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 500;

const inputClasses =
  'w-full rounded-[10px] bg-[var(--color-bg)] px-3.5 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]';

/**
 * "+ Custom Event" opens this instead of an always-visible inline form, so triggering
 * something bespoke never gets buried under the preset list.
 */
export function CustomEventSheet({ onTrigger, onClose }: CustomEventSheetProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState('');

  const handleTrigger = async () => {
    const trimmed = title.trim();
    if (trimmed.length === 0) {
      setError('Give the event a name');
      return;
    }

    setError('');
    setTriggering(true);
    try {
      await onTrigger(trimmed, description.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger the event');
    } finally {
      setTriggering(false);
    }
  };

  return (
    <BottomSheet
      title="Custom Event"
      description="One-off announcement for everyone's screen — not saved as a preset."
      onClose={onClose}
      locked={triggering}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={triggering}
            className="btn-outline flex-1 rounded-xl py-3.5 text-sm disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleTrigger}
            disabled={triggering}
            className="btn-gradient flex-[1.4] rounded-xl py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
          >
            {triggering ? 'TRIGGERING...' : 'TRIGGER NOW'}
          </button>
        </>
      }
    >
      <label
        htmlFor="custom-event-name"
        className="mb-1.5 block text-[10.5px] uppercase tracking-[0.05em] text-[var(--color-text-faint)]"
      >
        Event name
      </label>
      <input
        id="custom-event-name"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setError('');
        }}
        maxLength={MAX_TITLE_LENGTH}
        disabled={triggering}
        placeholder="e.g. Karaoke Break"
        className={`${inputClasses} mb-3.5 border border-[var(--color-border-gold)]`}
      />

      <label
        htmlFor="custom-event-description"
        className="mb-1.5 block text-[10.5px] uppercase tracking-[0.05em] text-[var(--color-text-faint)]"
      >
        Description (optional)
      </label>
      <input
        id="custom-event-description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={MAX_DESCRIPTION_LENGTH}
        disabled={triggering}
        placeholder="What should players do?"
        className={`${inputClasses} border border-[var(--color-border-subtle)]`}
      />

      {error && (
        <p className="mt-3 text-[12.5px] text-[var(--color-error)]" role="alert">
          {error}
        </p>
      )}
    </BottomSheet>
  );
}
