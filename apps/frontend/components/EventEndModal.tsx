'use client';

import { useEffect, useRef } from 'react';

interface EventEndModalProps {
  eventName: string;
  onClose: () => void;
}

export function EventEndModal({ eventName, onClose }: EventEndModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    buttonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
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
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-end-modal-title"
    >
      <div
        ref={modalRef}
        className="glass rounded-2xl p-6 max-w-sm w-full mx-4 space-y-5 animate-fade-in"
      >
        <h2
          id="event-end-modal-title"
          className="text-xl font-bold text-center font-[family-name:var(--font-display)]"
        >
          {eventName} has ended!
        </h2>

        <button
          ref={buttonRef}
          onClick={onClose}
          className="w-full py-3 px-4 btn-gradient rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  );
}
