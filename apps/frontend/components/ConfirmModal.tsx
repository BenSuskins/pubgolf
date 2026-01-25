'use client';

import { useEffect, useRef } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Typography } from './ui/Typography';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmModal({
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onCancel();
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
  }, [onCancel, loading]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <Card
        ref={modalRef}
        rounded="lg"
        padding="lg"
        className="max-w-sm w-full mx-4 space-y-5 animate-fade-in"
      >
        <Typography variant="heading" as="h2" id="confirm-modal-title" className="text-center">
          {title}
        </Typography>

        <Typography as="p" color="secondary" className="text-center">
          {message}
        </Typography>

        <div className="space-y-3">
          <Button
            onClick={onConfirm}
            disabled={loading}
            loading={loading}
            className="w-full"
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
          <Button
            ref={cancelButtonRef}
            onClick={onCancel}
            disabled={loading}
            variant="secondary"
            className="w-full"
          >
            {cancelText}
          </Button>
        </div>
      </Card>
    </div>
  );
}
