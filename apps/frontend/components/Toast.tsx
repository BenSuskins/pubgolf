'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ message, onDismiss, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="glass rounded-lg px-4 py-2 shadow-lg border border-[var(--color-border)]">
        <p className="text-sm text-[var(--color-text)]">{message}</p>
      </div>
    </div>
  );
}
