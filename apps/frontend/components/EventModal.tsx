'use client';

import { useEffect, useRef } from 'react';
import { EventPayload } from '@/lib/types';

interface EventModalProps {
  event: EventPayload;
  onDismiss: () => void;
}

export function EventModal({ event, onDismiss }: EventModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    buttonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onDismiss();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-modal-title"
    >
      <div
        ref={modalRef}
        className="glass rounded-2xl p-6 max-w-sm w-full mx-4 space-y-5 animate-fade-in"
      >
        <div className="text-center space-y-2">
          <div className="text-4xl">🎉</div>
          <h2
            id="event-modal-title"
            className="text-xl font-bold font-[family-name:var(--font-display)]"
          >
            {event.name}
          </h2>
        </div>

        <p className="text-center text-[var(--color-text-secondary)]">
          {event.description}
        </p>

        <button
          ref={buttonRef}
          onClick={onDismiss}
          className="w-full py-3 px-4 btn-gradient rounded-lg"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
